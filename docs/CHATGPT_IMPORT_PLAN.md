# ChatGPT Export Import Plan

## Purpose

When the ChatGPT export arrives, do not import it directly into live memory or project records.

The export must be staged first, classified second, reviewed third, and only then promoted into the live stores.

This prevents:

- junk or duplicate chat history from becoming permanent memory
- project details from being mixed into general memory
- one-off conversation fragments from polluting long-term recall
- large manuals and reference files from being treated like user memory

## Import Targets

The export content must be sorted into these destinations:

1. `shared memory`
- stable facts
- user preferences
- recurring people
- standing rules
- recurring themes
- long-term context worth recalling across sessions

2. `projects`
- one real project record per actual project
- high-level project summary
- project status
- project tags

3. `project notes`
- project-specific details
- plans
- decisions
- constraints
- research
- manuals and supporting reference material

4. `ignore`
- duplicate summaries
- throwaway back-and-forth
- stale one-off requests
- low-value filler

## Required Import Flow

### Phase 1: Stage

- upload the ChatGPT export into a staging area
- keep the raw source intact
- record source file name, import date, and source type
- do not write directly to shared memory or projects in this phase

### Phase 2: Classify

Each extracted record must be assigned one of:

- `memory`
- `project`
- `project_note`
- `ignore`

Classification rules:

- if the record is stable and reusable across many future sessions, it belongs in `memory`
- if the record describes a real ongoing effort, it belongs in `project`
- if the record contains details for a specific project, it belongs in `project_note`
- if the record is noisy, duplicate, stale, or not useful later, it belongs in `ignore`

### Phase 3: Review

Before promotion:

- inspect grouped records
- merge obvious duplicates
- verify project names are normalized
- verify memory entries are concise and durable
- reject junk

### Phase 4: Promote

After review:

- write approved long-term items into `/memory/entries`
- create/update projects
- attach project-specific material as notes linked by `projectId`

## Sorting Rules

### Shared Memory Rules

Good candidates:

- user preferences
- tone preferences
- repeated workflow habits
- recurring contacts
- recurring device behavior expectations
- durable project relationships

Bad candidates:

- temporary decisions
- transient troubleshooting chatter
- long raw transcripts
- duplicate summaries

### Project Rules

Create or update a project when:

- the export clearly refers to a named ongoing effort
- there are multiple related records around the same build, client, or initiative
- the project has enough substance to justify its own record

Project record should stay small:

- title
- summary
- tags
- status

### Project Note Rules

Use project notes for:

- detailed plans
- todo context
- constraints
- historical decisions
- manuals
- troubleshooting notes
- imported reference documents

## Manuals And Reference Files

Manuals should not go into shared memory unless they represent general durable knowledge that applies everywhere.

Default rule:

- manuals and PDFs go to `project_note`
- general persistent user/context facts go to `shared memory`

If a manual is not tied to a specific project yet:

- import it into a holding project or a generic library bucket
- then reassign it later once a real `projectId` exists

## Implementation Plan

### Step 1

Add a staging import type for ChatGPT exports so the raw export is preserved before any write to live stores.

### Step 2

Add classifier output buckets:

- `memory`
- `project`
- `project_note`
- `ignore`

### Step 3

Add a review surface in the operator panel:

- grouped staged records
- classification result
- duplicate detection
- promote / reject controls

### Step 4

Add promotion logic:

- staged `memory` -> `/memory/entries`
- staged `project` -> create/update project record
- staged `project_note` -> create note with `projectId`

### Step 5

Only after the ChatGPT export flow is stable, start importing manuals and larger reference files into their project-linked note paths.

## Working Rule For The Export

When the export arrives:

1. import to staging only
2. inspect the structure
3. map the export format to the four target buckets
4. review the grouped output
5. promote approved records into live memory/projects/notes

Do not bypass staging.
