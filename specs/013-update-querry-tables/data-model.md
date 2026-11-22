# Table state

Group nodes have an allowed resource field, its typed value, and a count restricted to the current list scope.
Leaves are existing list DTOs. Page, loading mode, expansion, and in-flight requests are view state, not database
records. Keep append progress separate for each branch; invalidate it when the effective query changes.
