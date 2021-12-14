# homebridge-http-entry

> A homebridge accessory to make HTTP calls to garage doors and gates.

Open, close, and get the state of your entry.

## Features

- Configurable endpoints for getting/setting entry state
- Support for any type of HTTP method (default: GET)
- Support for HTTP basic auth
- Configurable mapping of endpoint response body to HomeKit garage door states
- Supports pulling data from device (polling) or pushing from devices (webhooks)

## Install

- Requires homebridge (`npm install -g homebridge`).
- Requires Node >= 8.11

```
npm install -g homebridge-http-entry
```

## Usage

Update your homebridge configuration file with a new block under `accessories`.

Property | Type | Default | Description
---------|------|------|--------
`accessory` | _string_ | | **(Required)** `HttpEntry`
`name` | _string_ |  | **(Required)** The name of your accessory.
`enableDebugLog` | _bool_ | `false` | Enable extra debug logging.
`auth.username` | _string_ | | HTTP auth username
`auth.password` | _string_ | | HTTP auth password
`webhooks.accessoryId` | _string_ | | A unique id for notification server urls
`webhooks.password` | _string_ | | An optional password for notification server requests
`pollInterval` | _number_ | | Interval to poll in milliseconds. Ignored if used with `webhooks.accessoryId`
`endpoints` | _object_ | | Supports `getState`, `open`, `close`. See [Endpoint Configuration](#endpoint-configuration) for details
`mappers` | _object_ | | Supports `static`, `regex`, and `xpath`. See [Mappers](#mappers) for usage.

### Example config (minimal)

```json
{
  "accessory": "HttpEntry",
  "name": "Garage Bay 1",
  "endpoints": {
    "getState": {
      "method": "GET",
      "url": "http://bay1.local/state",
    },
    "open": {
      "method": "PUT",
      "url": "http://bay1.local/state",
      "body": "OPEN"
    },
    "close": {
      "method": "PUT",
      "url": "http://bay1.local/state",
      "body": "CLOSED"
    }
  }
}
```

### Endpoint Configuration

Endpoint configuration is passed directly to [`got`](https://github.com/sindresorhus/got). Minimally `url` makes this useful, but you may also craft requests with PUT or POST methods.

Example:

```json
{
  "url": "http://bay1.local/state",
  "method": "PUT",
  "body": "OPEN",
}
```

You may define any of the following endpoints:

- `getState`
- `open`
- `close`
- `cycle`

## Advanced

### Mappers

Mappers may be applied to the endpoint response to transform it into the numeric states expected by HomeKit. The `GarageDoorOpener` service expects one of the following states:

Value | State
----|----
`0` | open
`1` | closed
`2` | opening
`3` | closing
`4` | stopped

Mappers are applied in order, with the result of the previous passed to the next. Use the `mappers` property to configurare mappers for your accessory.

#### Static

> Map one value to another

Example configuration:

```json
{
  "type": "static",
  "parameters": {
    "mapping": {
      "OPENING": 2,
      "CLOSING": 3
    }
  }
}
```

Example response:

```
OPENING
```

Output:

```
2
```

#### Regex

> Capture output a regular expression

Example configuration:

```json
{
  "type": "regex",
  "parameters": {
    "regexp": "^The door is currently (OPEN|CLOSED), yo!$",
    "captureGroup": 1
  }
}
```

Example response

```
The door is currently OPEN, yo!
```

Output:

```
OPEN
```

#### XPath

> Capture output XML using XPath expressions

```json
{
  "type": "xpath",
  "parameters": {
    "xpath": "//dd/text()",
    "index": 0
  }
}
```

Example response:

```
<main>
  <h1>Door</h1>
  <dl>
    <dt>State</dt>
    <dd>OPENING</dd>
  </dl>
</main>
```

Output:

```
OPENING
```

### Webhooks

This accessory supports receiving updates via webhooks using [`homebridge-http-notification-server`](https://github.com/Supereg/homebridge-http-notification-server) as a more efficient alternative to polling. Use the `webhooks` configuration to receive state updates from your accessory.

1. Install and configure `homebridge-http-notification-server`.
2. Add `webhooks` configuration to this accessory.
3. Configure your sender

Example `webhooks` config:

```json
{
  "webhooks": {
    "accessoryId": "bay1"
  }
}
```

Example sender configuration:

```
{
  "characteristic": "TargetDoorState",
  "value": 1
}
```

`value` should reflect the current door state (0-4).

## Developing

## Testing

See https://github.com/homebridge/homebridge#plugin-development

1. `yarn test`
2. `yarn watch`
4. Configure homebridge from ~/.homebridge
5. `yarn http-server` and edit response from TestGateAccessory
6. Use an http client to create requests to notification server

Example:

```
POST http://127.0.0.1:8081
{
    "characteristic": "CurrentDoorState",
    "value": "1",
    "accessory": "gate"
}
```


## License

ISC
