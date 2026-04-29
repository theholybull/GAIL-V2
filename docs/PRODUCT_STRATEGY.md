# Product Strategy

## Date

2026-04-02

## Product Name

Gail

Working position:

- operator-first local AI presence platform
- local-first assistant runtime with avatar, workflow, device, and operator control surfaces
- designed for high-trust environments that want local control before cloud dependence

## Product Thesis

Gail should stop behaving like a loose collection of experiments and start behaving like one saleable system:

- one host machine runs the core intelligence, memory, workflow, and runtime services
- one operator shell controls the system end to end
- multiple client surfaces connect to that host with role-appropriate quality and permissions
- the system stays useful offline or degraded, instead of collapsing when cloud services wobble

The marketable story is not "an avatar toy".

The marketable story is:

- a local-first operator platform for guided AI-assisted presence, workflow execution, and multi-device runtime control

## Who This Is For

Primary target buyers:

1. solo operators and small studios running a persistent local AI + avatar + workflow stack
2. kiosk, showroom, or concierge deployments that need a controlled operator shell behind the public-facing surface
3. teams building guided digital-attendant systems where privacy, local ownership, and device control matter more than pure chat novelty

## Core Problems Gail Should Solve

1. Running AI, voice, avatar, workflow, and device-control surfaces from one coherent operator system is messy and brittle.
2. Most stacks are cloud-first and do not fail gracefully when connectivity, auth, or providers are unstable.
3. Multi-device experiences usually lack one reliable control center and one trusted state model.
4. Avatar/runtime systems are often disconnected from the real operator workflow that has to run them.

## Product Promise

Gail should promise four things clearly:

1. Local control first.
2. One operator shell for the full system.
3. Multi-device delivery from one trusted host.
4. Professional runtime discipline instead of demo-grade chaos.

## Product Pillars

### 1. Operator Control

The operator must be able to see, change, approve, and troubleshoot the system from one shell.

Includes:

- runtime settings
- workflow execution
- voice/provider control
- pairing and device trust
- asset/export management
- audit and change flow

### 2. Local-First Intelligence

The system must keep functioning in useful ways even when cloud paths fail or are intentionally disabled.

Includes:

- local persistence
- provider fallback behavior
- explicit mode handling
- durable operational state

### 3. Presence Runtime

The avatar and animation layer must be a real runtime product surface, not a detached art experiment.

Includes:

- clear export pipeline
- runtime profile targeting
- manifest-driven client delivery
- inspectable runtime mapping

### 4. Trusted Multi-Device Operation

The system must support host, panel, kiosk, phone, and watch-class clients without pretending all clients are equal.

Includes:

- paired-device identity
- permission-aware actions
- quality-tier targeting
- remote-access posture with explicit controls

## What The First Marketable Version Is

Gail v1 should be sold internally and externally as:

- a pre-release operator platform for local AI presence systems

Not as:

- a consumer chatbot
- a finished general-purpose digital human platform
- a production-grade cloud SaaS

## Marketable V1 Scope

The first marketable version should include only the things that support a coherent paid deployment story.

### Must Have

- stable backend startup and recovery
- one professional operator shell
- device pairing and trusted-action posture
- provider and voice controls
- workflow execution with visible artifacts
- avatar/runtime export path with profile targeting
- documented local and LAN deployment path
- smoke-tested critical flows
- clear operator manual and install/run guidance

### Should Have

- release packaging for a repeatable install path
- stronger route smoke coverage for shell-critical flows
- better audit stream and operator review checkpoints
- cleaner separation of prototype-only pages from real release pages

### Not Required For V1

- full cloud sync launch
- final public-facing consumer UI
- full marketplace ecosystem
- deep billing/multi-tenant SaaS layer

## Product Boundaries

To stay saleable, Gail needs firmer boundaries.

### Gail Is

- the host runtime
- the operator shell
- the workflow and device-control core
- the local-first presence runtime coordinator

### Gail Is Not Yet

- a full consumer app platform
- a polished enterprise admin suite
- a general-purpose game engine product
- a broad no-code automation platform

## Packaging Direction

Near-term packaging should be:

1. controlled local deployment from the repo with one-command startup
2. documented pre-release install path for pilot environments
3. optional desktop shell packaging after browser-hosted readiness is proven

Recommended release posture:

- pre-release pilot
- paid setup and integration path before any mass self-serve story

## Commercial Readiness Gates

Before calling Gail marketable, the repo needs evidence in five areas:

1. Product coherence: the core story is understandable in two minutes.
2. Operational reliability: startup, shutdown, pairing, shell navigation, and critical actions behave predictably.
3. Deployment discipline: install, update, backup, and rollback are documented.
4. Security posture honesty: auth limits and prototype gaps are explicit.
5. Demonstration quality: one complete end-to-end workflow can be shown cleanly without caveats every minute.

## Near-Term Productization Priorities

### Priority 1: Finish Professional Operator Shell

- complete high-value page wiring
- reduce scaffold feel
- improve error guidance
- add shell smoke coverage

### Priority 2: Define Release Surface

- decide which pages are release pages vs internal build pages
- mark experimental areas explicitly
- produce a clean demo path

### Priority 3: Harden Runtime Delivery

- confirm export pipeline repeatability
- validate runtime profile outputs
- reduce asset drift between Blender, backend, and client runtime

### Priority 4: Pilot Deployment Story

- clean install/run checklist
- host machine requirements
- supported client classes
- remote/LAN setup guidance

## Demo Narrative

The product demo should tell one clean story:

1. start the stack
2. open the operator shell
3. verify access and device posture
4. run or inspect a workflow
5. verify runtime profile and asset state
6. export or refresh the runtime
7. show the client consuming the result

If Gail cannot do that cleanly, it is still a build, not a product.

## Definition Of Marketable Pre-Release

Gail is ready to pitch as a real pre-release product when:

- the README reads like a product, not a lab notebook
- operator shell flows are coherent and defensible
- the pilot install path works on demand
- the runtime/export story is reliable enough for repeat demos
- docs, logs, and state stay in sync as part of normal engineering work