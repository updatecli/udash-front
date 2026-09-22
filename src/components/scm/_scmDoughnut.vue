<template>
  <div role="img" :aria-label="label || undefined" class="scm-doughnut">
    <Doughnut :data="chartData" :options="chartOptions" />
  </div>
</template>

<script>
import { Doughnut } from 'vue-chartjs'

import {
  Chart as ChartJS,
  ArcElement,
  DoughnutController,
  Tooltip,
  Legend,
} from 'chart.js'

// Register chart parts and plugin
ChartJS.register(ArcElement, DoughnutController, Tooltip, Legend)

export default {
    name: 'SCMDoughnut',
    components: {
        Doughnut,
    },

    props: {
        // label is the text alternative of the chart, since a canvas has none.
        label: {
            type: String,
            default: '',
        },

        chartData: {
            type: Object,
            required: true,
        },

        chartOptions: {
            type: Object,
            required: true,
            default: () => ({
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false,
                    },
                },
            }),
        },
    },
}

</script>

<style scoped>
.scm-doughnut {
  width: 100%;
  height: 100%;
}
</style>
