# Bounded context: Chart

This context manages the foundation of the Chart Entity.
It contains the domain, followed by the application and then the infra.

- Domain: Pure logic, it decides of the value-object, entiti, errors, event, interface and aggregate.
- Application: Uses the domain to orchestrate the logic.
- Infra: gives the background of the application.
