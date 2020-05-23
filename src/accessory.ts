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
import configureMappers from "./lib/configureMappers";
import configureEndpoints, {
    Endpoints,
    EndpointConfig,
} from "./lib/configureEndpoints";

interface AccessoryConfig {
    [key: string]: any;
}

export class HttpEntryAccessory {
    log: Logger;
    config: AccessoryConfig;
    api: API;
    mappers: MapperFunction[];
    endpoints: Endpoints;
    informationService: Service;
    service: Service;

    /**
     * REQUIRED - This is the entry point to your plugin
     */
    constructor(log: Logger, config: AccessoryConfig, api: API) {
        this.api = api;
        this.config = config;
        this.log = configureLogger(log, config.enableDebugLog);
        this.mappers = configureMappers(config.mappers);
        this.endpoints = configureEndpoints(config.endpoints);

        this.log.debug("HttpEntryAccessory Loaded");

        // your accessory must have an AccessoryInformation service
        this.informationService = new this.api.hap.Service.AccessoryInformation()
            .setCharacteristic(
                this.api.hap.Characteristic.Manufacturer,
                "Nic Haynes"
            )
            .setCharacteristic(this.api.hap.Characteristic.Model, "HttpEntry");

        this.service = this.createService();
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

    /**
     * REQUIRED - This must return an array of the services you want to expose.
     * This method must be named "getServices".
     */
    getServices() {
        return [this.informationService, this.service];
    }

    handleError(err, callback) {
        this.log.error(err.message);
        callback && callback(err);
    }

    async send(config: EndpointConfig) {
        return await got({
            ...config
        });
    }

    async getCurrentState(callback: CharacteristicGetCallback) {
        if (!this.endpoints.getState) {
            return callback(null);
        }

        try {
            const { body } = await this.send(this.endpoints.getState);
            const state = parseInt(this.applyMappers(body));
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
        return this.mappers.reduce(
            (acc: string, toValue) => toValue(acc),
            value
        );
    }
}
