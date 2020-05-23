import {
    API,
    Service,
    Logger,
    CharacteristicValue,
    CharacteristicSetCallback,
    CharacteristicGetCallback,
} from "homebridge";
import got from "got";
import { MapperFunction } from "./lib/mappers";
import configureLogger from "./lib/configureLogger";
import configureMappers, { MapperConfig } from "./lib/configureMappers";
import configurePubSub, {
    WebHookConfig,
    NotificationPayload,
} from "./lib/configurePubSub";
import configureEndpoints, {
    EndpointConfig,
    EndpointRequestConfig,
} from "./lib/configureEndpoints";

interface AccessoryConfig {
    name: string;
    enableDebugLog?: boolean;
    webhooks?: WebHookConfig;
    pollInterval?: number;
    mappers?: MapperConfig[];
    endpoints?: EndpointConfig;
}

export class HttpEntryAccessory {
    log: Logger;
    config: AccessoryConfig;
    api: API;
    mappers: MapperFunction[];
    endpoints: EndpointConfig;
    informationService: Service;
    service: Service;

    constructor(log: Logger, config: AccessoryConfig, api: API) {
        this.api = api;
        this.config = config;
        this.log = configureLogger(log, config.enableDebugLog);
        this.mappers = configureMappers(config.mappers);
        this.endpoints = configureEndpoints(config.endpoints);

        this.log.debug("HttpEntryAccessory Loaded");

        // Required
        this.informationService = new this.api.hap.Service.AccessoryInformation()
            .setCharacteristic(
                this.api.hap.Characteristic.Manufacturer,
                "Nic Haynes"
            )
            .setCharacteristic(this.api.hap.Characteristic.Model, "HttpEntry");

        this.service = this.createService();

        api.on("didFinishLaunching", () => {
            configurePubSub(
                {
                    webhooks: config.webhooks,
                    interval: config.pollInterval,
                    getState: this.getCurrentState,
                },
                this.handleNotification.bind(this),
                this.handleError.bind(this)
            );
        });
    }

    createService() {
        const { Service, Characteristic } = this.api.hap;
        const service = new Service.GarageDoorOpener(this.config.name);

        service
            .getCharacteristic(Characteristic.CurrentDoorState)
            .on("get", this.getCurrentState);

        service
            .getCharacteristic(Characteristic.TargetDoorState)
            .on("set", this.setTargetState);

        return service;
    }

    // Required
    getServices() {
        return [this.informationService, this.service];
    }

    handleNotification({ characteristic, value }: NotificationPayload) {
        const { Characteristic } = this.api.hap;

        if (characteristic === "CurrentDoorState") {
            this.service
                .setCharacteristic(Characteristic.CurrentDoorState, value)
                .setCharacteristic(Characteristic.TargetDoorState, value);
        } else {
            this.service.setCharacteristic(
                Characteristic[characteristic],
                value
            );
        }
    }

    handleError(err: Error, callback?) {
        this.log.error(err.message);
        callback && callback(err);
    }

    async send(config: EndpointRequestConfig) {
        return await got(config);
    }

    async getCurrentState(callback: CharacteristicGetCallback) {
        if (!this.endpoints.getState) {
            return callback(null);
        }

        try {
            const { body } = await this.send(this.endpoints.getState);
            const state = this.applyMappers(body);
            this.log.debug("Got accessory state %s", state);
            callback(null, state);
        } catch (err) {
            return this.handleError(err, callback);
        }
    }

    async setTargetState(
        value: CharacteristicValue,
        callback: CharacteristicSetCallback
    ) {
        const endpoint = this.getEndpoint(value);
        if (!endpoint || !endpoint.url) return;

        try {
            await this.send(endpoint);
            this.log.debug("Set accessory state to %s", value);
            callback(null);
        } catch (err) {
            this.handleError(err, callback);
        }
    }

    getEndpoint(targetState: CharacteristicValue) {
        const { OPEN, CLOSED } = this.api.hap.Characteristic.TargetDoorState;

        if (targetState === OPEN) {
            return this.endpoints.open;
        }

        if (targetState === CLOSED) {
            return this.endpoints.close;
        }

        return this.endpoints.cycle;
    }

    applyMappers(value: string) {
        const nextValue = this.mappers.reduce(
            (acc: string, toValue) => toValue(acc),
            value
        );
        return parseInt(nextValue, 10);
    }
}
