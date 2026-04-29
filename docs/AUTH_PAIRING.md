# Auth And Pairing

This document defines the current Gail prototype authentication and device-pairing model.

It is intentionally explicit because this area is transitional:

- the system is still in prototype-friendly `open` mode by default
- a real paired-device path now exists
- future tightening should build on this scaffold rather than replace it

## Purpose

The pairing scaffold exists to solve two different needs at the same time:

1. keep development friction low while the product is still being built
2. stop building more security-sensitive behavior on top of raw spoofable request headers

The result is a staged model:

- current prototype behavior remains usable
- real device credentials can already be issued and exercised
- stricter server modes can be enabled later with less rework

## Quick Start

If you just want the shortest usable path:

1. leave `GAIL_AUTH_MODE=open`
2. start the backend
3. open `/panel/`
4. use the `Pairing and Device Credentials` section
5. click `Refresh`
6. click `Create Pairing Session`
7. fill in the pair-device fields
8. click `Complete Pairing`
9. confirm a token is returned
10. click `Save Token`
11. click `Use Paired Device In Context`

That gives you a real paired-device token path without blocking the rest of the prototype.

## Current Auth Modes

The backend reads `GAIL_AUTH_MODE`.

Supported values:

- `open`
- `paired`
- `paired_required_for_sensitive`

### `open`

This is the current default.

Behavior:

- unpaired devices can still access the backend
- legacy header-based request context still works
- if a valid paired-device token is supplied, the backend prefers token-backed identity over spoofable headers

This is the correct mode for active prototyping.

### `paired`

Scaffolded, not yet the recommended daily prototype mode.

Behavior:

- requests without a valid paired-device token are rejected
- paired devices authenticate with a token issued during pairing

This is the future baseline for normal access once operator flows and tests are more mature.

### `paired_required_for_sensitive`

Scaffolded as the intended stepping stone toward stricter enforcement.

Target intent:

- normal low-risk reads could remain more flexible during transition
- sensitive routes would require a paired-device identity

Current first enforced sensitive set includes:

- provider configuration changes
- device registration and trust/access-window changes
- approval creation and resolution
- cart approval request and commit paths

This is the first enforcement layer, not the final route matrix.

## Current Architecture

The current flow has four layers:

1. request headers
2. optional device token
3. server-side device registry
4. route policy and approval policy

### Request headers

Headers still provide:

- requested mode
- requested device type
- requested device id
- explicit local save intent

These remain useful as UI context and as a fallback path while prototyping.

### Device token

If a valid bearer token is present, the backend resolves:

- the paired device record
- the trusted server-side device id
- the server-side device type

The token-backed identity overrides spoofable header identity.

### Device registry

The device registry remains the server-side source of truth for:

- trust state
- device type
- default mode
- quality tier
- unlock-window state
- paired state
- pair timestamp
- last-seen timestamp
- last-seen address

### Route policy

Route policy still applies the existing permission matrix.

This means:

- a token does not bypass device restrictions
- a token does not bypass Private Mode restrictions
- a token does not bypass approval and unlock-window rules

## New Backend Routes

Current pairing/auth routes:

- `GET /auth/status`
- `POST /auth/pairing-sessions`
- `POST /auth/pairing-sessions/:id/complete`

### `GET /auth/status`

Returns the current auth posture:

- `authMode`
- `pairingRequired`
- `pairingRequiredForSensitive`

Use this route first when validating a deployment or environment.

### `POST /auth/pairing-sessions`

Creates a short-lived pairing session.

Current behavior:

- pairing is only allowed from localhost or a private-LAN address
- the server returns a session id and pairing code
- the session expires automatically after a short window

This is the “same network as the host” pairing gate requested for the project.

### `POST /auth/pairing-sessions/:id/complete`

Completes pairing by:

- validating the session
- validating the pairing code
- registering or updating the device profile as paired
- issuing a device credential
- returning the raw auth token to the client

The raw token is only returned at issuance time.

## Pairing Flow

This is the intended prototype pairing flow.

1. connect the candidate device to the same LAN as the Gail host
2. create a pairing session from that device
3. read the returned `pairingCode`
4. complete the pairing session with device metadata
5. receive the issued `authToken`
6. store the token on the client
7. use that token for later remote access

In practical terms:

- pairing proves “this device was present on the local network during enrollment”
- the issued credential proves identity after that

## LAN Constraint

The pairing session creation and completion routes currently allow:

- `127.0.0.1`
- `::1`
- common RFC1918 private ranges

This is a practical prototype filter, not a perfect network-trust model.

Current limitation:

- this is address-based LAN gating, not a cryptographically strong same-LAN proof

That is acceptable for this stage because the goal is to establish the pairing workflow and credential issuance path first.

## Device Credentials

When pairing completes, the backend creates a persistent device credential record.

Stored fields include:

- credential id
- device id
- label
- token hash
- created timestamp
- last-used timestamp

Important behavior:

- the database stores only the token hash
- the raw token is returned once at issuance time
- later authentication works by hashing the presented token and looking up the stored hash

## Operator Panel Support

The operator panel now supports the pairing flow directly.

New panel capabilities:

- inspect `/auth/status`
- create a pairing session
- complete pairing
- capture the issued auth token
- store the token in browser `localStorage`
- clear the token manually
- apply the paired device identity into the current request context

### Local Storage Behavior

The operator panel stores the device token in browser `localStorage` for convenience.

This is a prototype operator convenience feature.

Current tradeoff:

- it makes repeated testing easier
- it is not the final production-secret storage strategy

Future production clients should use platform-appropriate secure storage.

## Request Behavior With Token Present

When the panel has a token:

- the panel sends `Authorization: Bearer <token>`
- the backend resolves the paired device
- the backend uses the token-backed device id and type as the effective identity

This matters because it prevents the panel from accidentally testing security-sensitive flows only through spoofable headers.

## Current Prototype Limitations

The pairing/auth layer is intentionally incomplete in a few ways:

- `open` mode is still the default
- operator access is not yet forced through pairing
- sensitive-route enforcement is not yet fully split by auth mode
- there is no passkey/WebAuthn flow yet
- there is no token rotation or revocation UI yet
- there is no multi-credential management UI yet

These are known limitations, not accidental omissions.

## What This Solves Right Now

Even before strict enforcement, this scaffold already improves the project in important ways:

- it creates a real credentialed identity path
- it provides a future migration path away from header-only trust
- it lets remote access eventually depend on issued credentials rather than shared ids
- it adds paired-device metadata to the registry
- it allows token-backed testing without breaking the current prototype loop
- it fits cleanly behind a private network layer such as Tailscale for remote web access

## What It Does Not Solve Yet

It does not yet provide:

- production-grade public internet security
- complete remote hardening
- passkey-based user auth
- origin restrictions
- rate limiting
- token revocation policy
- admin-only pairing approval flows
- network transport and private-network setup by itself

This is a device-credential scaffold, not a full production security system.

## Recommended Near-Term Follow-Up

The next hardening steps should happen in this order:

1. add operator-panel guidance and test coverage for the pairing workflow
2. require paired identity for sensitive routes first
3. add credential revocation and re-issue flows
4. add stronger admin auth and origin restrictions
5. move toward browser-grade auth for human-admin flows

## Configuration

Relevant current environment variables:

- `GAIL_AUTH_MODE`
- `GAIL_BACKEND_HOST`
- `GAIL_BACKEND_PORT`

Recommended current prototype setting:

- `GAIL_AUTH_MODE=open`

Recommended next tightening step after operator usage is comfortable:

- `GAIL_AUTH_MODE=paired_required_for_sensitive`

Recommended later stricter baseline:

- `GAIL_AUTH_MODE=paired`

## Testing Notes

The backend regression suite now covers:

- auth status route
- pairing session creation
- pairing completion
- token-backed request success

That coverage is still basic, but it ensures the scaffold is not just documented without validation.

## Summary

The current model is:

- open by default
- pairable on the local network
- token-capable for later remote access
- backward-compatible with prototype flows
- ready for stricter enforcement without a major redesign
