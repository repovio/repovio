# Presentation state

The page owns summary visibility. The table owns search and all existing query state. Layout depends on visible
intervening content and available width. Toggling or resizing must not recreate query state, reset pagination, or
refresh the data. Changing the query follows the existing table pagination behavior.
