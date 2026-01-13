<template>
  <Doughnut :data="chartData" :options="chartOptions" />
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

    data() {
        return {
            options: {}
        }
    },

    created() {
        this.options = this.chartOptions
        this.options.plugins = {}
        // Set default legend position
        this.options.plugins.legend = {
            display: false,
        }
    },


    props: {
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
