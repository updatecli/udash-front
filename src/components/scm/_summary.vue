<template>
    <v-container>
        <v-row v-if="isNoData()" class="text-center pa-12">
          <v-col>
            <div class="empty-state">
              <v-icon size="96" color="grey-lighten-2">mdi-alert-decagram-outline</v-icon>
              <h3 class="text-h5 mt-6 mb-2 font-weight-medium">No Dashboard Found</h3>
            </div>
          </v-col>
        </v-row>
        <!-- SCM Cards Layout -->
        <v-row v-if="!isNoData() && !hideRepositoryTitle" class="mb-2">
            <v-col cols="12" class="text-right">
                <v-btn
                    size="small"
                    variant="outlined"
                    @click="toggleAllRepos"
                >
                    {{ areAllReposCollapsed() ? 'Show all SCMs' : 'Hide all SCMs' }}
                </v-btn>
            </v-col>
        </v-row>

        <v-row v-if="!isNoData()">
            <v-col
                v-for="(scmData, url) in data"
                :key="url"
                cols="12"
                md="12"
                lg="12"
                class="mb-4"
            >
                <v-card
                    flat
                    variant="flat"
                    class="h-100"
                >
                    <v-card-text class="pa-0">
                        <v-row no-gutters class="repo-split-row">
                            <v-col
                                v-if="!hideRepositoryTitle"
                                cols="12"
                                md="3"
                                class="repo-side"
                            >
                                <div class="d-flex align-center pa-4">
                                    <v-icon class="mr-2">{{ getGitIcon(url) }}</v-icon>
                                    <span class="text-truncate repo-title">{{ sanitizeURL(url) }}</span>
                                </div>
                                <div class="px-4 pb-4 d-flex align-center">
                                    <v-chip
                                        variant="outlined"
                                        size="x-small"
                                        class="mr-2"
                                    >
                                        {{ getBranchEntries(scmData).length }} branches
                                    </v-chip>
                                    <v-btn
                                        variant="text"
                                        size="small"
                                        @click="toggleRepo(url)"
                                    >
                                        {{ isRepoCollapsed(url) ? 'Show' : 'Hide' }}
                                    </v-btn>
                                </div>
                            </v-col>

                            <v-col
                                cols="12"
                                :md="hideRepositoryTitle ? 12 : 9"
                                class="branch-side"
                            >
                                <div
                                    v-if="isRepoCollapsed(url)"
                                    class="pa-4 text-caption text-grey-darken-1"
                                >
                                    Branches are hidden. Click Show to expand on the right.
                                </div>

                                <template v-else>
                                    <div
                                        v-for="([branch, branchData], index) in getVisibleBranchEntries(url, scmData)"
                                        :key="branch"
                                        class="branch-item"
                                    >
                                        <router-link
                                            v-if="!hideButton"
                                            :to="`/pipeline/reports?scmid=${branchData.id}`"
                                            style="text-decoration: none; color: inherit;"
                                        >
                                            <div class="clickable-branch">
                                                <div class="d-flex align-center pa-4">

                                                    <div class="branch-info flex-grow-1">
                                                        <v-row>
                                                            <v-col>
                                                                <div class="d-flex align-center mb-2">
                                                                    <v-icon
                                                                        size="small"
                                                                        class="mr-2"
                                                                        color="grey-darken-1"
                                                                    >
                                                                        mdi-source-branch
                                                                    </v-icon>
                                                                    <div class="flex-grow-1">
                                                                        <div class="font-weight-medium">{{ branch }}</div>
                                                                        <div class="text-caption text-grey-darken-1">
                                                                            {{ branchData.total_result || 0 }} reports
                                                                        </div>
                                                                    </div>
                                                                    <v-icon
                                                                        size="small"
                                                                        color="grey-lighten-1"
                                                                    >
                                                                        mdi-chevron-right
                                                                    </v-icon>
                                                                </div>
                                                            </v-col>
                                                        </v-row>
                                                        <v-row>
                                                            <v-col>
                                                                <div class="status-summary">
                                                                    <v-chip
                                                                        v-for="(count, status) in branchData.total_result_by_type"
                                                                        :key="status"
                                                                        :color="getStatusColor(status)"
                                                                        size="x-small"
                                                                        class="status-chip"
                                                                    >
                                                                        <span class="status-chip-status">{{ status }}</span>
                                                                        <span class="status-chip-value">{{ getStatusPercentage(count, branchData.total_result) }}</span>
                                                                    </v-chip>
                                                                </div>
                                                            </v-col>
                                                        </v-row>
                                                    </div>

                                                    <div class="chart-container" v-if="hasDoughnutData(url, branch)">
                                                        <SCMDoughnut
                                                            :chartData="getDoughnutData(url, branch)"
                                                            :chartOptions="miniDoughnutOptions"
                                                            :centerText="branchData.total_result"
                                                            size="small"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </router-link>

                                        <div v-else class="non-clickable-branch">
                                            <div class="d-flex align-center pa-4">
                                                <v-row>
                                                    <v-col>
                                                        <div class="branch-info flex-grow-1">
                                                            <div class="d-flex align-center mb-2">
                                                                <v-icon
                                                                    size="small"
                                                                    class="mr-2"
                                                                    color="grey-darken-1"
                                                                >
                                                                    mdi-source-branch
                                                                </v-icon>
                                                                <div class="flex-grow-1">
                                                                    <div class="font-weight-medium">{{ branch }}</div>
                                                                    <div class="text-caption text-grey-darken-1">
                                                                        {{ branchData.total_result || 0 }} reports
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div class="status-summary">
                                                                <v-chip
                                                                    v-for="(count, status) in branchData.total_result_by_type"
                                                                    :key="status"
                                                                    :color="getStatusColor(status)"
                                                                    size="x-small"
                                                                    class="status-chip"
                                                                >
                                                                    <span class="status-chip-status">{{ status }}</span>
                                                                    <span class="status-chip-value">{{ getStatusPercentage(count, branchData.total_result) }}</span>
                                                                </v-chip>
                                                            </div>
                                                        </div>
                                                    </v-col>
                                                    <v-col>
                                                        <div class="chart-container" v-if="hasDoughnutData(url, branch)">
                                                            <SCMDoughnut
                                                                :chartData="getDoughnutData(url, branch)"
                                                                :chartOptions="miniDoughnutOptions"
                                                                :centerText="branchData.total_result"
                                                                size="small"
                                                            />
                                                        </div>
                                                    </v-col>
                                                </v-row>
                                            </div>
                                        </div>

                                        <v-divider
                                            v-if="index < getVisibleBranchEntries(url, scmData).length - 1"
                                        ></v-divider>
                                    </div>

                                    <div
                                        v-if="hasMoreRepoBranches(url, scmData)"
                                        class="pa-3 text-center"
                                    >
                                        <v-btn
                                            size="small"
                                            variant="outlined"
                                            @click="loadMoreBranches(url)"
                                        >
                                            Load More Branches
                                        </v-btn>
                                    </div>
                                </template>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- Loading and Pagination Controls -->
        <v-row v-if="totalCount > 1" justify="center">
            <v-col cols="12" md="6">
                <v-card variant="flat" class="text-center">
                    <v-card-text>
                        <div class="mb-3">
                            <v-chip variant="outlined" size="small">
                                {{ loadedScmBranchCount }} of {{ totalScmCount }} {{ scmLabel }}
                            </v-chip>
                        </div>

                        <v-progress-linear
                            :model-value="progressPercentage"
                            color="grey-darken-3"
                            height="6"
                            rounded
                            class="mb-3"
                        ></v-progress-linear>

                        <v-btn
                            v-if="hasMoreData && !isLoading"
                            color="grey-darken-3"
                            variant="outlined"
                            @click="loadMoreData"
                            :loading="isLoading"
                        >
                            Load More
                        </v-btn>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
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

import { getApiBaseURL } from '@/composables/api';
import { isAuthEnabled } from '@/composables/runtime';

ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend)

const EMPTY_DONUT_DATA = Object.freeze({ labels: [], datasets: [] });
const COLLAPSE_STORAGE_KEY = 'udash:scm-summary-collapse-state';

export default {
    components: {
        SCMDoughnut,
    },
    name: "SCMDashboard",
    props: {
        filter: {
            type: Object,
            default: () => ({})
        },
        hideButton: {
            type: Boolean,
            default: false
        },
        fullWidth: {
            type: Boolean,
            default: false
        },
        hideRepositoryTitle: {
            type: Boolean,
            default: false
        }
    },
    data: () => ({
        data: {},
        doughnutData: {},
        doughnutOptions: {
            responsive: true,
        },
        miniDoughnutOptions: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true
                }
            }
        },
        currentPage: 0,
        itemsPerPage: 25,
        totalCount: 0,
        isLoading: false,
        hasMoreData: true,
        loadedPages: new Set(),
        isFetching: false,
        hasSearched: false,
        collapseAllByDefault: true,
        collapsedRepositories: {},
        visibleBranchesByRepo: {},
        initialBranchPageSize: 10,
    }),

    computed: {
        loadedScmBranchCount() {
            return this.countLoadedScmBranches(this.data);
        },

        totalScmCount() {
            return Number(this.totalCount) || 0;
        },

        scmLabel() {
            return this.totalScmCount === 1 ? 'SCM branch' : 'SCM branches';
        },

        progressPercentage() {
            if (this.totalScmCount <= 0) {
                return 0;
            }

            return Math.min(100, Math.round((this.loadedScmBranchCount / this.totalScmCount) * 100));
        },
    },

    watch: {
        filter: {
            deep: true,
            async handler() {
                this.resetPagination();
                await this.loadNextPage();
            },
        },
    },

    methods: {
        isNoData() {
            return this.hasSearched && this.totalCount == 0 && !this.isLoading;
        },

        resetPagination() {
            this.currentPage = 0;
            this.totalCount = 0;
            this.hasMoreData = true;
            this.loadedPages.clear();
            this.data = {};
            this.doughnutData = {};
            this.hasSearched = true;
            this.visibleBranchesByRepo = {};
        },

        loadPersistedCollapseState() {
            try {
                const rawValue = localStorage.getItem(COLLAPSE_STORAGE_KEY);
                if (!rawValue) {
                    return;
                }

                const savedState = JSON.parse(rawValue);

                if (typeof savedState.collapseAllByDefault === 'boolean') {
                    this.collapseAllByDefault = savedState.collapseAllByDefault;
                }

                if (savedState.collapsedRepositories && typeof savedState.collapsedRepositories === 'object' && !Array.isArray(savedState.collapsedRepositories)) {
                    this.collapsedRepositories = Object.fromEntries(
                        Object.entries(savedState.collapsedRepositories).filter(([url, isCollapsed]) => typeof url === 'string' && typeof isCollapsed === 'boolean')
                    );
                }
            } catch (error) {
                console.warn('Unable to restore persisted SCM collapse state', error);
            }
        },

        persistCollapseState() {
            try {
                const stateToPersist = {
                    collapseAllByDefault: this.collapseAllByDefault,
                    collapsedRepositories: this.collapsedRepositories,
                    updatedAt: new Date().toISOString(),
                };

                localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify(stateToPersist));
            } catch (error) {
                console.warn('Unable to persist SCM collapse state', error);
            }
        },

        countLoadedScmBranches(allScmData) {
            return Object.values(allScmData || {}).reduce((total, scmData) => {
                if (!scmData || typeof scmData !== 'object') {
                    return total;
                }

                return total + Object.keys(scmData).length;
            }, 0);
        },

        getBranchEntries(scmData) {
            if (!scmData || typeof scmData !== 'object') {
                return [];
            }

            return Object.entries(scmData).sort((a, b) => {
                const totalA = Number(a?.[1]?.total_result) || 0;
                const totalB = Number(b?.[1]?.total_result) || 0;
                return totalB - totalA;
            });
        },

        isRepoCollapsed(url) {
            if (this.hideRepositoryTitle) {
                return false;
            }

            if (Object.prototype.hasOwnProperty.call(this.collapsedRepositories, url)) {
                return this.collapsedRepositories[url];
            }

            return this.collapseAllByDefault;
        },

        toggleRepo(url) {
            this.collapsedRepositories = {
                ...this.collapsedRepositories,
                [url]: !this.isRepoCollapsed(url),
            };

            if (!this.visibleBranchesByRepo[url]) {
                this.visibleBranchesByRepo[url] = this.initialBranchPageSize;
            }

            this.persistCollapseState();
        },

        areAllReposCollapsed() {
            const urls = Object.keys(this.data || {});
            if (urls.length === 0) {
                return true;
            }

            return urls.every((url) => this.isRepoCollapsed(url));
        },

        toggleAllRepos() {
            const collapseAll = !this.areAllReposCollapsed();
            const collapsedRepositories = { ...this.collapsedRepositories };

            this.collapseAllByDefault = collapseAll;

            Object.keys(this.data || {}).forEach((url) => {
                collapsedRepositories[url] = collapseAll;

                if (!this.visibleBranchesByRepo[url]) {
                    this.visibleBranchesByRepo[url] = this.initialBranchPageSize;
                }
            });

            this.collapsedRepositories = collapsedRepositories;
            this.persistCollapseState();
        },

        visibleBranchCount(url) {
            return this.visibleBranchesByRepo[url] || this.initialBranchPageSize;
        },

        getVisibleBranchEntries(url, scmData) {
            const entries = this.getBranchEntries(scmData);

            if (this.isRepoCollapsed(url)) {
                return [];
            }

            return entries.slice(0, this.visibleBranchCount(url));
        },

        hasMoreRepoBranches(url, scmData) {
            return this.getBranchEntries(scmData).length > this.visibleBranchCount(url);
        },

        loadMoreBranches(url) {
            this.visibleBranchesByRepo[url] = this.visibleBranchCount(url) + this.initialBranchPageSize;
        },

        isFullWidth() {
            return this.fullWidth;
        },

        defaultLgCol() {
            return this.isFullWidth() ? 12 : 4;
        },

        defaultMgCol() {
            return this.isFullWidth() ? 12 : 6;
        },

        async loadNextPage() {
            if (!this.hasMoreData || this.isFetching) {
                return;
            }

            const next = this.currentPage + 1;
            await this.getSummaryData(next, false);
            this.currentPage = next;

            if (this.currentPage >= this.totalCount) {
                this.hasMoreData = false;
            }
        },

        async getSummaryData(page= 1 , reset = false) {
            // Avoid duplicate requests for the same page
            if ((this.loadedPages.has(page) && !reset) || this.isFetching) {
                return;
            }

            this.isFetching = true;
            this.isLoading= true;
            this.$emit('loaded', false)

            try {
                const auth_enabled = isAuthEnabled;
                const restrictedSCM = router.currentRoute.value.query.filter?.scmid;

                const requestBody = {
                    summary: true,
                    limit: this.itemsPerPage,
                    page,
                };

                // Add SCM ID filter if provided
                if (restrictedSCM) {
                    requestBody.scmid = restrictedSCM;
                } else if (this.filter?.scmid && this.filter?.scmid !== '') {
                    requestBody.scmid = this.filter.scmid;
                }

                 // Add starttime and endtime filters if provided
                if (this.filter?.startTime && this.filter.endTime ) {
                    requestBody.start_time = this.filter.startTime;
                    requestBody.end_time = this.filter.endTime;
                }

                if (this.filter?.labels && typeof this.filter.labels === 'object' && !Array.isArray(this.filter.labels)) {
                    const labels = {};
                    Object.entries(this.filter.labels).forEach(([key, value]) => {
                        if (typeof key === 'string' && value !== undefined && value !== null) {
                            labels[key] = String(value);
                        }
                    });

                    if (Object.keys(labels).length > 0) {
                        requestBody.labels = labels;
                    }
                }

                const query = `${getApiBaseURL()}/pipeline/scms/search`;

                let response;
                if (auth_enabled) {
                    const token = await this.$auth0.getAccessTokenSilently();
                    response = await fetch(query, {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestBody),
                    });
                } else {
                    response = await fetch(query, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestBody),
                    });
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
                    this.doughnutData = {};
                } else {
                    // Merge new data with existing data
                    this.data = { ...this.data, ...scmData };
                }

                // Mark this page as loaded
                this.loadedPages.add(page);

                // Check if there's more data to load
                this.hasMoreData = this.countLoadedScmBranches(this.data) < this.totalCount;

                                // Update doughnut chart data only for the newly loaded items
                                this.updateDoughnutDataForScmData(scmData);

            } catch (error) {
                console.error('Error fetching summary data:', error);
                // Handle error appropriately
            } finally {
                                this.isFetching = false;
                this.isLoading = false;
                this.$emit('loaded', true);
            }
        },

        async loadMoreData() {
            if (this.hasMoreData && !this.isLoading && !this.isFetching) {
                await this.loadNextPage();
            }
        },



        resetFilter: function() {
            this.$emit('update-filter', '');
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
                    if (!url || !branch) return EMPTY_DONUT_DATA;
                    const d = this.doughnutData?.[url]?.[branch];

                    if (!d || !Array.isArray(d.labels) || !Array.isArray(d.datasets)) {
                        return EMPTY_DONUT_DATA;
                    }

                    return d;
        },

        hasDoughnutData(url, branch) {
          const d = this.getDoughnutData(url, branch);
          return Array.isArray(d.datasets) && d.datasets.length > 0;
        },

        buildDoughnutData(branchData) {
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

            if (!branchData || branchData.total_result === undefined) {
                return EMPTY_DONUT_DATA;
            }

            const resultsByType = branchData.total_result_by_type || {};

            let successResults = 0;
            let warningResults = 0;
            let errorResults = 0;
            let skippedResults = 0;
            let otherResults = 0;

            for (let result in resultsByType) {
                if (result === '✔') {
                    successResults = resultsByType[result];
                } else if (result === '✗') {
                    errorResults = resultsByType[result];
                } else if (result === '⚠') {
                    warningResults = resultsByType[result];
                } else if (result === '-') {
                    skippedResults = resultsByType[result];
                } else {
                    otherResults += resultsByType[result];
                }
            }

            return {
                labels,
                datasets: [
                    {
                        data: [successResults, warningResults, errorResults, skippedResults, otherResults],
                        backgroundColor: labelColors,
                    }
                ]
            };
        },

        updateDoughnutDataForScmData(scmData) {
            if (!scmData || typeof scmData !== 'object') {
                return;
            }

            for (let url in scmData) {
                if (!this.doughnutData[url]) {
                    this.doughnutData[url] = {};
                }

                const branches = scmData[url] || {};
                for (let branch in branches) {
                    this.doughnutData[url][branch] = this.buildDoughnutData(branches[branch]);
                }
            }
        },

        getStatusColor(status) {
            switch(status) {
                case '✔': return 'success';
                case '⚠': return 'warning';
                case '✗': return 'error';
                case '-': return 'grey';
                default: return 'purple';
            }
        },

        getStatusPercentage(count, total) {
            const safeCount = Number(count) || 0;
            const safeTotal = Number(total) || 0;

            if (safeTotal <= 0) {
                return '0%';
            }

            return `${Math.round((safeCount / safeTotal) * 100)}%`;
        },
    },
    async created() {
        this.loadPersistedCollapseState();
        this.resetPagination();
        await this.loadNextPage();
    },

}
</script>

<style scoped>
.repo-split-row {
    min-height: 100%;
}

.repo-side {
    border-right: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(0, 0, 0, 0.01);
}

.branch-side {
    min-height: 100%;
}

.repo-title {
    max-width: 100%;
}

.branch-item {
    transition: background-color 0.2s ease;
}

.branch-item:hover {
    background-color: rgba(0, 0, 0, 0.02);
}

.chart-container {
    width: 100px;
    height: 100px;
    flex-shrink: 0;
}

/* Medium screens and up */
@media (min-width: 768px) {
    .chart-container {
        width: 150px;
        height: 150px;
    }
}

/* Large screens and up */
@media (min-width: 1024px) {
    .chart-container {
        width: 200px;
        height: 140px;
    }
}

.status-summary {
    max-width: 220px;
    margin-right: auto;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
}

.status-chip {
    margin: 0;
    width: 100%;
    justify-content: stretch;
}

.status-chip :deep(.v-chip__content) {
    width: 100%;
    display: flex;
    align-items: center;
}

.status-chip-status {
    font-weight: 600;
}

.status-chip-value {
    margin-left: auto;
    min-width: 48px;
    text-align: right;
    font-variant-numeric: tabular-nums;
}

.branch-info {
    min-width: 0; /* Allows text-truncate to work in flex */
}

@media (max-width: 959px) {
    .repo-side {
        border-right: 0;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }
}
</style>
