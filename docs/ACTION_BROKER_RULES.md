# Action Broker Rules

## Core Rule

AI does not directly control the OS, apps, purchases, or outbound communication. All actions go through the Action Broker.

## Broker Responsibilities

- validate requests
- check device permissions
- check mode restrictions
- enforce confirmation requirements
- execute allowed actions
- log action and result

## Risk Levels

### Low

- open browser
- open notes
- play music
- show reminders

### Medium

- draft email
- attach candidate file
- imports
- cart modifications
- cart approval requests

### High

- send email
- approve purchase
- delete records
- clear memory
- modify permissions
- final cart approval commit
