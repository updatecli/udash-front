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

const centerTextPlugin = {
  id: 'centerText',
  beforeDraw(chart) {
    const { width, height, ctx } = chart
    const text = chart.config.options.plugins.centerText?.text
    const yOffset = chart.config.options.plugins?.centerText?.yOffset || 0

    if (!text) return

    ctx.save()
    ctx.font = 'bold 18px Roboto'
    ctx.fillStyle = '#333'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, width / 2, height / 2 + yOffset)
    ctx.restore()
  },
}


// Register chart parts and plugin
ChartJS.register(ArcElement, DoughnutController, Tooltip, Legend, centerTextPlugin)

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
        // Set center text if provided
        this.options.plugins.centerText = {
            text: this.centerText,
            yOffset: -5,
        }

        if (this.chartData.labels.length === 5) {
            this.options.plugins.centerText.yOffset = -30
        }

        // Set default legend position
        this.options.plugins.legend = {
            position: 'bottom',
        }
        console.log('Custom Data:', this.options)
    },


    props: {
        centerText: {
            type: Number,
            default: 0,
            required: true,
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
                        position: 'top',
                    },
                    centerText: {
                        text: '',
                    },
                },
            }),
        },
    },
}

</script>