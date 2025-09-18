<template>
    <v-container>
        <v-expansion-panels
            multiple
            flat
            tile
            v-model="localExpandedSummary"
        >
            <v-expansion-panel
                v-for="(scmData, url) in data"
                :key="url"
                :hide-actions="false"

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
        <!-- Floating bottom indicator with pulse animation -->
        <v-fab
            v-if="hasMoreData && !isLoading"
            class="scroll-indicator"
            color="grey-darken-3"
            size="small"
            location="bottom center"
            @click="loadMoreData"
        >
            <v-icon class="pulse-animation">mdi-chevron-down</v-icon>
        </v-fab>

        <!-- Data summary -->
        <div v-if="totalCount > 1" class="text-center pa-2">
            <v-chip variant="outlined" size="small">
                {{ Object.keys(data).length }} of {{ totalCount }} SCMs
            </v-chip>
        </div>
        </v-expansion-panels>

        <!-- Progress indicator -->
        <v-card v-if="totalCount > 1" variant="flat" class="mt-4 v-col-6 offset-3">
            <v-card-text>
                <div class="d-flex align-center justify-space-between mb-2">
                    <span class="text-body-2">Loading Progress</span>
                    <span class="text-body-2">{{ Object.keys(data).length }} / {{ totalCount }}</span>
                </div>
                <v-progress-linear
                    :model-value="(Object.keys(data).length / totalCount) * 100"
                    color="grey-darken-3"
                    height="8"
                ></v-progress-linear>

                <div v-if="hasMoreData" class="text-center mt-3">
                    <v-btn
                        v-if="!isLoading"
                        color="grey-darken-3"
                        variant="text"
                        @click="loadMoreData"
                        append-icon="mdi-chevron-down"
                    >
                        Load More
                    </v-btn>
                </div>
            </v-card-text>
        </v-card>
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

import router from '../../router'

import SCMDoughnut from './_scmDoughnut.vue'

ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend)

export default {
    components: {
        SCMDoughnut,
    },
    name: "SCMDashboard",
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
        currentPage: 1,
        itemsPerPage: 1,
        totalCount: 0,
        isLoading: false,
        hasMoreData: true,
        loadedPages: new Set(),
    }),

    watch: {
      scmid () {
        this.resetPagination();
        this.getSummaryData(1,true);
      },
      expandedSummary(newVal) {
        this.localExpandedSummary = newVal;
      },
  },

    methods: {
        resetPagination() {
            this.currentPage = 1;
            this.totalCount = 0;
            this.hasMoreData = true;
            this.loadedPages.clear();
            this.data = {};
            this.doughnutData = {};
        },

        async getSummaryData(page= 1 , reset = false) {
            // Avoid duplicate requests for the same page
            if (this.loadedPages.has(page) && !reset) {
                return;
            }

            this.isLoading= true;
            this.$emit('loaded', false)

                        try {
                const auth_enabled = process.env.VUE_APP_AUTH_ENABLED === 'true';
                const restrictedSCM = router.currentRoute.value.query.scmid;

                // Build query with pagination parameters
                const params = new URLSearchParams();
                params.append('summary', 'true');
                params.append('limit', this.itemsPerPage);
                params.append('page', this.currentPage);

                // Add SCM ID filter if provided
                if (restrictedSCM) {
                    params.append('scmid', restrictedSCM);
                } else if (this.scmid && this.scmid !== '') {
                    params.append('scmid', this.scmid);
                }

                let query = `/api/pipeline/scms?${params.toString()}`;

                let response;
                if (auth_enabled) {
                    const token = await this.$auth0.getAccessTokenSilently();
                    response = await fetch(query, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                } else {
                    response = await fetch(query);
                }

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const responseData = await response.json();

                // Handle different response structures
                const scmData = responseData.data || responseData.scms || responseData;
                const totalCount = responseData.total_count || 0;

                // Update total count
                this.totalCount = totalCount;

                if (reset) {
                    // Reset data for new search
                    this.data = scmData;
                    this.localExpandedSummary = Object.keys(scmData);
                } else {
                    // Merge new data with existing data
                    this.data = { ...this.data, ...scmData };
                    const newKeys = Object.keys(this.data);
                    this.localExpandedSummary = [...new Set([...this.localExpandedSummary, ...newKeys])];
                }

                // Mark this page as loaded
                this.loadedPages.add(page);

                // Check if there's more data to load
                this.hasMoreData = Object.keys(this.data).length < this.totalCount;

                // Update doughnut chart data
                this.updateDoughnutData();

            } catch (error) {
                console.error('Error fetching summary data:', error);
                // Handle error appropriately
            } finally {
                this.isLoading = false;
                this.$emit('loaded', true);
            }
        },

        async loadMoreData() {
            if (this.hasMoreData && !this.isLoading) {
                this.currentPage++;
                await this.getSummaryData(this.currentPage, false);
            }
        },

        // Infinite scroll handler
        handleScroll() {
            const scrollHeight = document.documentElement.scrollHeight;
            const scrollTop = document.documentElement.scrollTop;
            const clientHeight = document.documentElement.clientHeight;

            // Load more data when user is near the bottom (100px threshold)
            if (scrollTop + clientHeight >= scrollHeight - 100) {
                this.loadMoreData();
            }
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

                    this.doughnutData[url][branch] = {
                        labels: labels,
                        datasets: [
                            {
                                data: [successResults,warningResults, errorResults, skippedResults, otherResults],
                                backgroundColor: labelColors
                            }
                        ]
                    }
                }
            }
        },
    },
    async created() {
        try {
            this.getSummaryData(1, true);
        } catch(error) {
            console.log(error);
        }
    },
    mounted() {
        // Add infinite scroll listener
        window.addEventListener('scroll', this.handleScroll);
    },

    beforeUnmount() {
        // Clean up scroll listener if using infinite scroll
        window.removeEventListener('scroll', this.handleScroll);
    }
}
</script>

<style scoped>
.scroll-indicator {
    position: fixed !important;
    bottom: 150px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
}

.pulse-animation {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.1);
        opacity: 0.7;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}
</style>
