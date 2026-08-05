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
