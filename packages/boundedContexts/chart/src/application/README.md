## Application

Should be agnostic, describe the behavior of the interraction with the data storage. Separated by queries and commands.

### Example:

- queries

  - GetChartQuery: interface description
  - GetChartHandler: agnostic get chart implementation

- commands
  - CreateChartCommand: interface description
  - CreateChartHandler: agnostic create implementation
