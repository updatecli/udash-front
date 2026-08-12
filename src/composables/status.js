export function getStatusColor(input){
      switch (input) {
        case "✔":
          return "success"
        case "✗":
          return "red"
        case "⚠":
          return "orange"
        case "-":
          return "grey"
        default:
          return "yellow"
      }
    }

export function getStatusIcon(status){
      switch (status) {
        case "✔":
          return "mdi-check-circle"
        case "✗":
          return "mdi-close-circle"
        case "⚠":
          return "mdi-alert-circle"
        case "-":
          return "mdi-minus-circle"
        default:
          return "mdi-help-circle"
      }
}

// PIPELINE_RESULTS describes the four results a pipeline report can carry, for the
// controls where someone picks a result by name with no data in front of them.
//
// The wording is deliberately not the one getStatusText returns. That function also
// labels the source, condition and target rows, where the same glyphs mean something
// else: a "✔" on a condition means the condition passed, not that nothing changed. It
// reads "Warning" for "⚠" too, which at pipeline level says the opposite of what
// happened, since "⚠" is how Updatecli reports that it applied a change.
export const PIPELINE_RESULTS = [
  { value: '✔', title: '✔ Success', subtitle: 'Ran fine, nothing to change' },
  { value: '⚠', title: '⚠ Changed', subtitle: 'Updatecli applied a change' },
  { value: '✗', title: '✗ Failed', subtitle: 'Something went wrong, or a condition did not pass' },
  { value: '-', title: '- Skipped', subtitle: 'Did not run' },
]

// PIPELINE_RESULT_VALUES is what a pipeline result may be, to check the results
// restored from a URL or from the local storage before querying with them.
export const PIPELINE_RESULT_VALUES = PIPELINE_RESULTS.map((result) => result.value)

// OPEN_ACTION_OPTIONS describes whether a pipeline carries an action left open, such as a
// pull request still waiting to be merged.
//
// This is deliberately a dimension of its own rather than a fifth entry of
// PIPELINE_RESULTS: an open action is orthogonal to the result. A pipeline may have
// succeeded because its change is already waiting in a pull request, but it may also have
// changed something and just opened one, or be failing while a pull request from a previous
// run is still around. A fifth result would have to pick one of those and lose the others.
//
// "✔ with an open pull request" is the one worth looking for: those pipelines report a
// success and had nothing to change only because the change is already waiting to be
// merged, so they are invisible among the genuinely up to date ones.
export const OPEN_ACTION_OPTIONS = [
  { value: 'open', title: 'With an open pull request', subtitle: 'A change is waiting to be merged' },
  { value: 'none', title: 'Without any open pull request', subtitle: 'Nothing to follow up' },
]

// OPEN_ACTION_VALUES is what the open action filter may be, to check the value restored
// from a URL or from the local storage before querying with it.
export const OPEN_ACTION_VALUES = OPEN_ACTION_OPTIONS.map((option) => option.value)

// openActionToQuery maps the filter value to what the API expects, an optional boolean:
// unset does not filter anything out, true only keeps the pipelines carrying an open
// action and false only the ones without.
export function openActionToQuery(value) {
  switch (value) {
    case 'open':
      return true
    case 'none':
      return false
    default:
      return undefined
  }
}

// OPEN_ACTION_ICON is the icon standing for an action left open. The merge request variant
// is picked per repository by getActionIcon where the provider is known.
export const OPEN_ACTION_ICON = 'mdi-source-pull'

// OPEN_ACTION_COLOR is the colour standing for an action left open. It matches "⚠" rather
// than "✔" on purpose: a pipeline in that state needs someone to look at it.
export const OPEN_ACTION_COLOR = 'warning'

// OPEN_ACTION_RESULT_SEGMENTS labels the result buckets once split on the open action
// dimension, for the charts counting reports per result. Only the results which can
// realistically carry an open action are split; the others would only ever show an empty
// segment.
export const OPEN_ACTION_RESULT_SEGMENTS = {
  '✔': { label: '✔ Waiting to be merged', subtitle: 'Succeeded, the change is already in an open pull request' },
  '⚠': { label: '⚠ Changed, pull request open', subtitle: 'Updatecli applied a change and opened a pull request' },
}

export function getStatusText(input){
      const statusMap = {
        '✔': 'Success',
        '✗': 'Failed',
        '⚠': 'Warning',
        '-': 'Skipped',
        '?': 'Unknown'
      };
      return statusMap[input] || input || 'Unknown';
}
