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
