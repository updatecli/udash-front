<template>
    <v-container
        class="py-8 px-6"
        fluid
    >
        <v-expansion-panels
            multiple
            flat
            tile
            v-model="localExpandedSummary"
        >
            <v-expansion-panel
                v-for="(scmData, url) in data"
                :key="url"
                :hide-actions="true"

            >
                <v-expansion-panel-title
                >
                    <v-toolbar
                        density="compact"
                        class="text-white"
                    >
                        <v-toolbar-title
                            class="flex text-center"
                        >
                            <v-icon>{{ getGitIcon(url) }}</v-icon>{{  sanitizeURL(url) }}
                        </v-toolbar-title>
                    </v-toolbar>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                    <v-card
                        variant="flat"
                    >
                        <v-card-text>
                            <v-timeline
                                density="compact"
                                align="start"
                                justify="center"
                                direction="vertical"
                                line-thickness="2"
                                line-color="grey-darken-3"
                            >
                                <v-timeline-item
                                    v-for="(branchData, branch) in scmData"
                                    :key="branch"
                                    dot-color="grey-darken-3"
                                    icon-color="white"
                                    fill-dot
                                    icon="mdi-source-branch"
                                >
                                    <v-card
                                        min-width="300"
                                        flat
                                    >
                                        <v-card-title
                                            variant="flat"
                                        >
                                            <v-toolbar
                                                density="compact"
                                                class="text-white"
                                                variant="text"
                                                flat
                                            >
                                                <v-toolbar-title
                                                    class="flex text-center"
                                                >
                                                    {{  branch  }}
                                                </v-toolbar-title>

                                                <v-btn
                                                    class="text-right"
                                                    justify-center
                                                    v-if="!hideButton"
                                                    :to="`/pipeline/reports?scmid=${branchData.id}`"
                                                    icon="mdi-arrow-right-circle"
                                                    slim
                                                    density="compact"
                                                >
                                                </v-btn>
                                            </v-toolbar>
                                        </v-card-title>
                                        <v-card-text
                                            variant="outlined"
                                            class="text-center"
                                        >
                                            <SCMDoughnut
                                                :chartData="getDoughnutData(url, branch)"
                                                :chartOptions="doughnutOptions"
                                                :centerText="branchData.total_result"
                                            />
                                        </v-card-text>
                                    </v-card>
                                </v-timeline-item>
                            </v-timeline>
                        </v-card-text>
                        <v-divider></v-divider>
                    </v-card>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
    </v-container>
</template>

<script>

import {
  Chart as ChartJS,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'

import { UDASH_API_VERSION } from '@/constants';

import router from '../../router'

import SCMDoughnut from './_scmDoughnut.vue'

ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend)

export default {
    components: {
        SCMDoughnut,
    },
    name: "SCMSummary",
    props: {
        scmid: {
            type: String,
            default: ''
        },
        hideButton: {
            type: Boolean,
            default: false
        },
        expandedSummary: {
            type: Array,
            default: () => [],
        }
    },
    data: () => ({
        data: {},
        localExpandedSummary: [],
        doughnutData: {},
        doughnutOptions: {
            responsive: true,
        },
    }),

    watch: {
      scmid () {
        this.getSummaryData();
      },
      expandedSummary(newVal) {
        this.localExpandedSummary = newVal;
      },
  },

    methods: {
        async getSummaryData() {
            this.$emit('loaded', false)
            const auth_enabled = process.env.VUE_APP_AUTH_ENABLED === 'true';
            const restrictedSCM = router.currentRoute.value.query.scmid

            let query = `/api/${ UDASH_API_VERSION}/pipeline/scms?summary=true`;
            if (restrictedSCM != undefined) {
                query = query + `&&scmid=${restrictedSCM}`
            } else if ( this.scmid != "" ){
                query = query + `&&scmid=${this.scmid}`
            }

            if (this.scmid != undefined && this.scmid != '' && this.scmid != null) {
                query += `&&scmid=${this.scmid}`;
            }

            if (auth_enabled) {
                const token = await this.$auth0.getAccessTokenSilently();
                const response = await fetch(query, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const data = await response.json();
                this.data = data.data;
                this.updateDoughnutData();
            } else {
                const response = await fetch(query);
                const data = await response.json();
                this.data = data.data;
                this.updateDoughnutData();
            }

            this.$emit('loaded', true)
        },

        resetFilter: function() {
            this.$emit('update-scmid', '');
        },

        sanitizeURL: function(url) {
            if (url === undefined) {
                return "";
            }

            url = url.replace(/https?:\/\//, '');
            url = url.replace(/http?:\/\//, '');
            url = url.replace(/github.com\//, '');
            url = url.replace(/gitlab.com\//, '');
            url = url.replace(/\/$/, '');
            url = url.replace(/\.git$/, '');

            return url;
        },

        getGitIcon: function(url) {
            url = url.replace(/https?:\/\//, '');
            url = url.replace(/http?:\/\//, '');

            if (url.startsWith('github.com')) {
                return 'mdi-github';
            } else if (url.startsWith('gitlab.com')) {
                return 'mdi-gitlab';
            } else if (url.startsWith('bitbucket.org')) {
                return 'mdi-bitbucket';
            } else {
                return 'mdi-git';
            }

        },

        getDoughnutData(url, branch) {

            if (url === undefined || branch === undefined) {
                return {};
            }

            if (this.doughnutData[url] === undefined) {
                return {};
            }

            if (this.doughnutData[url][branch] === undefined) {
                return {};
            }

            return this.doughnutData[url][branch];
        },

        updateDoughnutData: function(){
            const labels = [
                '✔ Success',
                '⚠ Warning',
                '✗ Error',
                '- Skipped',
                '? Unknown',
            ];
            const labelColors = [
               'rgba(16, 185, 129, 0.7)',  // Green
               'rgba(245, 158, 11, 0.7)',  // Amber
               'rgba(220, 38, 38, 0.7)',   // Red
               'rgba(107, 114, 128, 0.7)', // Gray
               'rgba(139, 92, 246, 0.7)',  // Purple
            ];

            if (this.data === undefined) {
                return;
            }

            for (let url in this.data) {
                for ( let branch in this.data[url] ) {
                    if (this.data[url][branch].total_result === undefined) {
                        continue;
                    }

                    let successResults = 0;
                    let warningResults = 0;
                    let errorResults = 0;
                    let skippedResults = 0;
                    let otherResults = 0;

                    for ( let result in this.data[url][branch].total_result_by_type ) {
                        if (result === '✔') {
                            successResults = this.data[url][branch].total_result_by_type[result];
                        } else if (result === '✗') {
                            errorResults = this.data[url][branch].total_result_by_type[result];
                        } else if (result === '⚠') {
                            warningResults = this.data[url][branch].total_result_by_type[result];
                        } else if (result === '-') {
                            skippedResults = this.data[url][branch].total_result_by_type[result];
                        } else {
                            otherResults += this.data[url][branch].total_result_by_type[result];
                        }
                    }

                    if (this.doughnutData[url] === undefined) {
                        this.doughnutData[url] = {};
                    }

                    if (this.doughnutData[url][branch] === undefined) {
                        this.doughnutData[url][branch] = {};
                    }

                    if (this.data[url][branch].total_result === successResults) {

                        this.doughnutData[url][branch] = {
                            labels: labels,
                            datasets: [
                                {
                                    data: [successResults,warningResults, errorResults, skippedResults, otherResults],
                                    backgroundColor: labelColors,
                                }
                            ]
                            }
                    } else {
                        this.doughnutData[url][branch] = {
                            labels: labels,
                            datasets: [
                                {
                                    data: ["0",warningResults, errorResults, skippedResults, otherResults],
                                    backgroundColor: labelColors
                                }
                            ]
                        }
                    }
                }
            }
        },
    },
    async created() {
        try {
            this.getSummaryData();
        } catch(error) {
            console.log(error);
        }
    }
}
</script>
