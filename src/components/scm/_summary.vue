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
        <v-row v-if="!isNoData()" class="mb-2">
            <v-col cols="12" class="text-right">
                <v-btn
                    v-if="!hideRepositoryTitle"
                    size="small"
                    variant="outlined"
                    class="mr-2"
                    @click="toggleAllRepos"
                >
                    {{ areAllReposCollapsed() ? 'Show all SCMs' : 'Hide all SCMs' }}
                </v-btn>
                <v-btn
                    v-if="hasEmptyEntries"
                    size="small"
                    variant="outlined"
                    @click="toggleHideEmpty"
                >
                    {{ hideEmpty ? 'Show empty' : 'Hide empty' }}
                </v-btn>
            </v-col>
        </v-row>

        <v-row v-if="!isNoData()">
            <v-col
                v-for="(scmData, url) in displayedData"
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
                                                                            {{ branchData.total_result || 0 }} {{ (branchData.total_result || 0) === 1 ? 'pipeline' : 'pipelines' }}
                                                                        </div>
                                                                    </div>
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
                                                                        size="small"
                                                                        class="status-chip"
                                                                    >
                                                                        <span class="status-chip-status">{{ status }}</span>
                                                                        <span class="status-chip-value">{{ getStatusPercentage(count, branchData.total_result) }}</span>
                                                                    </v-chip>
                                                                </div>

                                                                <div
                                                                    v-if="getTotalActionURL(url, branch) > 0"
                                                                    class="status-summary mt-1"
                                                                >
                                                                    <v-tooltip
                                                                        v-if="(branchData.total_result || 0) > 0"
                                                                        location="top"
                                                                    >
                                                                        <template #activator="{ props }">
                                                                            <v-chip
                                                                                v-bind="props"
                                                                                :color="getOpenActionCount(url, branch) > 0 ? 'warning' : 'success'"
                                                                                :variant="getOpenActionCount(url, branch) > 0 ? 'tonal' : 'outlined'"
                                                                                size="small"
                                                                                class="status-chip attention-chip"
                                                                            >
                                                                                <v-icon size="x-small" class="mr-1">
                                                                                    {{ getOpenActionCount(url, branch) > 0 ? getActionIcon(url) : 'mdi-check-circle-outline' }}
                                                                                </v-icon>
                                                                                <span class="status-chip-status">{{ getOpenActionCount(url, branch) > 0 ? `Open ${getActionShortLabel(url)}` : `No open ${getActionShortLabel(url)}` }}</span>
                                                                                <span v-if="getOpenActionCount(url,branch) !== 0" class="status-chip-value">{{ getOpenActionCount(url, branch) }}</span>
                                                                            </v-chip>
                                                                        </template>
                                                                        <span>{{ getActionTooltip(url, branch) }}</span>
                                                                    </v-tooltip>
                                                                </div>
                                                            </v-col>
                                                        </v-row>
                                                    </div>

                                                    <div class="chart-container" v-if="hasDoughnutData(url, branch)">
                                                        <SCMDoughnut
                                                            :chartData="getDoughnutData(url, branch)"
                                                            :chartOptions="doughnutOptionsFor(url, branch, branchData)"
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
                                                                >
                                                                    mdi-source-branch
                                                                </v-icon>
                                                                <div class="flex-grow-1">
                                                                    <div class="font-weight-medium">{{ branch }}</div>
                                                                    <div class="text-caption text-grey-darken-1">
                                                                        {{ branchData.total_result || 0 }} {{ (branchData.total_result || 0) === 1 ? 'pipeline' : 'pipelines' }}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div class="status-summary">
                                                                <v-chip
                                                                    v-for="(count, status) in branchData.total_result_by_type"
                                                                    :key="status"
                                                                    :color="getStatusColor(status)"
                                                                    size="small"
                                                                    class="status-chip"
                                                                >
                                                                    <span class="status-chip-status">{{ status }}</span>
                                                                    <span class="status-chip-value">{{ getStatusPercentage(count, branchData.total_result) }}</span>
                                                                </v-chip>
                                                            </div>
                                                            <div
                                                                v-if="getTotalActionURL(url, branch) > 0"
                                                                class="status-summary mt-1"
                                                            >

                                                                <v-tooltip
                                                                    location="top"
                                                                >
                                                                    <template #activator="{ props }">
                                                                        <v-chip
                                                                            v-bind="props"
                                                                            :color="getOpenActionCount(url, branch) > 0 ? 'warning' : 'success'"
                                                                            :variant="getOpenActionCount(url, branch) > 0 ? 'tonal' : 'outlined'"
                                                                            size="small"
                                                                            class="status-chip attention-chip"
                                                                        >
                                                                            <v-icon size="x-small" class="mr-1">
                                                                                {{ getOpenActionCount(url, branch) > 0 ? getActionIcon(url) : 'mdi-check-circle-outline' }}
                                                                            </v-icon>
                                                                            <span class="status-chip-status">{{ getOpenActionCount(url, branch) > 0 ? `Open ${getActionShortLabel(url)}` : `No open ${getActionShortLabel(url)}` }}</span>
                                                                            <span class="status-chip-value">{{ getOpenActionCount(url, branch) }}</span>
                                                                        </v-chip>
                                                                    </template>
                                                                    <span>{{ getActionTooltip(url, branch) }}</span>
                                                                </v-tooltip>
                                                            </div>
                                                        </div>
                                                    </v-col>
                                                    <v-col>
                                                        <div class="chart-container" v-if="hasDoughnutData(url, branch)">
                                                            <SCMDoughnut
                                                                :chartData="getDoughnutData(url, branch)"
                                                                :chartOptions="doughnutOptionsFor(url, branch, branchData)"
                                                                :centerText="branchData.total_result"
                                                                size="small"
                                                            />
                                                        </div>
                                                    </v-col>
                                                </v-row>
                                            </div>
                                        </div>

                                        <!-- Reports received on this branch. It sits
                                             outside the link above so hovering the bars
                                             does not read as navigation, and it only
                                             mounts once a repository is expanded, so a
                                             collapsed page costs nothing.

                                             It follows the filter's window: the bucket
                                             size is derived from that window, so the
                                             last day now reads as hours rather than
                                             collapsing into a single bar. Every card
                                             shares the one window, which is what keeps
                                             the branches comparable to each other. It
                                             falls back to the full history when no
                                             range is set. -->
                                        <div class="branch-activity px-4 pb-2">
                                            <ActivityChart
                                                mode="volume"
                                                granularity="auto"
                                                height="44px"
                                                compact
                                                :start-time="filter.startTime || ''"
                                                :end-time="filter.endTime || ''"
                                                :days="maxHistoryDays"
                                                :scmid="branchData.id"
                                                :labels="filter.labels"
                                                :results="filter.results"
                                                :open-action="filter.openAction ?? null"
                                            />
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
                <v-card variant="flat" class="text-center" color="background">
                    <v-card-text>
                        <div class="mb-3">
                            <v-chip variant="outlined" size="small">
                                {{ loadedScmBranchCount }} of {{ totalScmCount }} {{ scmLabel }}
                            </v-chip>
                        </div>

                        <v-progress-linear
                            :model-value="progressPercentage"
                            height="6"
                            rounded
                            class="mb-3"
                        ></v-progress-linear>

                        <v-btn
                            v-if="hasMoreData && !isLoading"
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
import ActivityChart from '../pipeline/activityChart.vue'

import { apiFetch } from '@/composables/api';
import { extractGitURLInfo } from '@/composables/git';
import { getStorageKey, getMaxHistoryDays } from '@/composables/runtime';
import { encodeFilterState, decodeFilterState } from '@/composables/filter';

ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend)

const EMPTY_DONUT_DATA = Object.freeze({ labels: [], datasets: [] });

// DOUGHNUT_SEGMENTS ties every slice to the pipeline result it counts, so the chart
// and the click handler reading a slice back cannot drift apart. The last one has no
// result: it counts whatever Updatecli did not report as one, so there is nothing to
// filter on, and clicking it does nothing.
//
// The wording follows PIPELINE_RESULTS rather than getStatusText: at pipeline level
// "⚠" is Updatecli reporting that it changed something, which "Warning" reads as the
// opposite of.
//
// Success is split in two, matching RESULT_SERIES in activityChart.vue. A pipeline which
// had nothing to change reports a success even when the change is already waiting in a
// pull request nobody merged, and those are the ones worth looking at: without the split
// they are indistinguishable from the branches which are genuinely up to date.
const DOUGHNUT_SEGMENTS = Object.freeze([
    { result: '✔', openAction: true, label: '✔ Waiting to be merged', color: 'rgba(59, 130, 246, 0.7)' }, // Blue
    { result: '✔', openAction: false, label: '✔ Success', color: 'rgba(16, 185, 129, 0.7)' },  // Green
    { result: '⚠', label: '⚠ Changed', color: 'rgba(245, 158, 11, 0.7)' },  // Amber
    { result: '✗', label: '✗ Failed', color: 'rgba(220, 38, 38, 0.7)' },    // Red
    { result: '-', label: '- Skipped', color: 'rgba(107, 114, 128, 0.7)' }, // Gray
    { result: null, label: '? Unknown', color: 'rgba(139, 92, 246, 0.7)' }, // Purple
]);
const COLLAPSE_STORAGE_KEY = getStorageKey('scm.summary.collapse.v1');

export default {
    components: {
        SCMDoughnut,
        ActivityChart,
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
        currentRequestId: 0,
        hasSearched: false,
        collapseAllByDefault: true,
        collapsedRepositories: {},
        visibleBranchesByRepo: {},
        initialBranchPageSize: 10,
        hideEmpty: false,
    }),

    computed: {
        // The per-branch activity strips span whatever history this instance is
        // configured to serve, so they narrow along with MAX_HISTORY_DAYS.
        maxHistoryDays() {
            return getMaxHistoryDays();
        },

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

        displayedData() {
            if (!this.hideEmpty) return this.data;
            return Object.fromEntries(
                Object.entries(this.data).filter(([, scmData]) =>
                    Object.values(scmData).some(branch => (Number(branch?.total_result) || 0) > 0)
                )
            );
        },

        hasEmptyEntries() {
            return Object.values(this.data).some(scmData =>
                Object.values(scmData).some(branch => (Number(branch?.total_result) || 0) === 0)
            );
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
            this.currentRequestId += 1;
            this.isFetching = false;
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

                if (typeof savedState.hideEmpty === 'boolean') {
                    this.hideEmpty = savedState.hideEmpty;
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
                    hideEmpty: this.hideEmpty,
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

            const entries = Object.entries(scmData).sort((a, b) => {
                const totalA = Number(a?.[1]?.total_result) || 0;
                const totalB = Number(b?.[1]?.total_result) || 0;
                return totalB - totalA;
            });

            if (!this.hideEmpty) return entries;
            return entries.filter(([, branchData]) => (Number(branchData?.total_result) || 0) > 0);
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

        toggleHideEmpty() {
            this.hideEmpty = !this.hideEmpty;
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

            await this.getSummaryData(this.currentPage + 1, false);
        },

        async getSummaryData(page= 1 , reset = false) {
            // Avoid duplicate requests for the same page
            if ((this.loadedPages.has(page) && !reset) || this.isFetching) {
                return;
            }

            const requestId = this.currentRequestId;
            this.isFetching = true;
            this.isLoading= true;
            this.$emit('loaded', false)

            try {
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

                if (Array.isArray(this.filter?.results) && this.filter.results.length > 0) {
                    requestBody.results = this.filter.results;
                }

                // Tri-state: an unset filter has to stay absent from the body rather than
                // be sent as false, which would drop every pipeline with an open pull
                // request.
                if (typeof this.filter?.openAction === 'boolean') {
                    requestBody.open_action = this.filter.openAction;
                }

                const responseData = await apiFetch('/pipeline/scms/search', {
                    method: 'POST',
                    body: requestBody,
                });

                // Discard stale results if the filter changed while fetching
                if (requestId !== this.currentRequestId) return;

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

                // Mark this page as loaded and advance the page cursor
                this.loadedPages.add(page);
                this.currentPage = page;

                // Check if there's more data to load
                this.hasMoreData = this.countLoadedScmBranches(this.data) < this.totalCount;

                // Update doughnut chart data only for the newly loaded items
                this.updateDoughnutDataForScmData(scmData);

            } catch (error) {
                if (requestId === this.currentRequestId) {
                    console.error('Error fetching summary data:', error);
                }
            } finally {
                if (requestId === this.currentRequestId) {
                    this.isFetching = false;
                    this.isLoading = false;
                    this.$emit('loaded', true);
                }
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

        getTotalActionURL(url,branch) {
            if (!url || !branch) return 0;
            const d = this.data?.[url]?.[branch];
            return Number(d?.total_action_urls) || 0;
        },

        getActionProvider(url) {
            const gitInfo = extractGitURLInfo(url || '');
            return gitInfo?.provider || 'unknown';
        },

        getActionShortLabel(url) {
            return this.getActionProvider(url) === 'gitlab' ? 'MR' : 'PR';
        },

        getActionIcon(url) {
            return this.getActionProvider(url) === 'gitlab' ? 'mdi-source-merge' : 'mdi-source-pull';
        },

        getOpenActionCount(url, branch) {
            return this.getTotalActionURL(url, branch);
        },

        getActionTooltip(url, branch) {
            const count = this.getOpenActionCount(url, branch);
            const shortLabel = this.getActionShortLabel(url);

            if (count > 0) {
                return `${count} open ${shortLabel} requires attention`;
            }

            return `No open ${shortLabel} requires attention`;
        },

        buildDoughnutData(branchData) {
            if (!branchData || branchData.total_result === undefined) {
                return EMPTY_DONUT_DATA;
            }

            const resultsByType = branchData.total_result_by_type || {};
            // total_open_action_by_result is a breakdown of total_result_by_type rather
            // than an addition to it, so a split result contributes to both of its
            // segments and the doughnut still totals total_result.
            const openActionsByType = branchData.total_open_action_by_result || {};
            const counts = DOUGHNUT_SEGMENTS.map(() => 0);

            for (let result in resultsByType) {
                const open = openActionsByType[result] || 0;

                const openIndex = DOUGHNUT_SEGMENTS.findIndex(
                    (segment) => segment.result === result && segment.openAction === true);
                const index = DOUGHNUT_SEGMENTS.findIndex(
                    (segment) => segment.result === result && segment.openAction !== true);

                if (openIndex !== -1) {
                    counts[openIndex] += open;
                }

                // Anything which is not an Updatecli result lands in the last segment,
                // which is the one carrying no result and so the one not filtering. A
                // result without a split segment keeps its whole count, so an open action
                // on it is still counted, just not called out.
                counts[index === -1 ? DOUGHNUT_SEGMENTS.length - 1 : index] +=
                    openIndex === -1 ? resultsByType[result] : resultsByType[result] - open;
            }

            return {
                labels: DOUGHNUT_SEGMENTS.map((segment) => segment.label),
                datasets: [
                    {
                        data: counts,
                        backgroundColor: DOUGHNUT_SEGMENTS.map((segment) => segment.color),
                    }
                ]
            };
        },

        // doughnutOptionsFor gives every doughnut its own options so the click handler
        // knows which branch it belongs to. They are cached outside the reactive state:
        // handing the chart a fresh options object on each render would have it
        // reinitialise itself, and writing to reactive data while rendering would loop.
        doughnutOptionsFor(url, branch, branchData) {
            const key = JSON.stringify([url, branch]);

            if (!this.doughnutOptionsCache[key]) {
                const scmID = branchData.id;

                this.doughnutOptionsCache[key] = {
                    ...this.miniDoughnutOptions,
                    onHover: (event, elements) => {
                        const target = event?.native?.target;
                        if (target) {
                            target.style.cursor = this.isFilterableSegment(elements) ? 'pointer' : 'default';
                        }
                    },
                    onClick: (event, elements) => {
                        if (!this.isFilterableSegment(elements)) {
                            return;
                        }

                        // On the dashboard the whole card is a link to this branch's
                        // reports, and the canvas sits inside it. Stop the click there
                        // so picking a segment does not also follow the link, losing
                        // the result on the way.
                        event?.native?.preventDefault();
                        event?.native?.stopPropagation();

                        const segment = DOUGHNUT_SEGMENTS[elements[0].index];
                        this.selectResult(segment.result, scmID, segment.openAction);
                    },
                };
            }

            return this.doughnutOptionsCache[key];
        },

        // isFilterableSegment answers whether a click landed on a segment standing for
        // a single result. The unknown one counts everything Updatecli did not report
        // as a result, which is not something the search API can be asked for.
        isFilterableSegment(elements) {
            if (!Array.isArray(elements) || elements.length === 0) {
                return false;
            }

            return !!DOUGHNUT_SEGMENTS[elements[0].index]?.result;
        },

        // openAction is undefined for the segments counting a result whole, and true or
        // false for the two halves of a split one, which have to carry both dimensions
        // so the reader lands on the pipelines the slice actually stood for.
        selectResult(result, scmID, openAction) {
            if (this.hideButton) {
                // The reports for this branch are already on screen, so narrowing the
                // filter in place is enough; navigating would only lose the reader's
                // position on the page.
                this.$emit('toggle-result', result, openAction);
                return;
            }

            // The card already links to this branch's reports, so a segment click goes
            // to that same place with the result carried over rather than somewhere
            // new. The current filter travels along, keeping the date range and the
            // labels the reader had set here.
            const query = { ...router.currentRoute.value.query, scmid: scmID };
            const state = decodeFilterState(query.filter) || {};

            state.selectedResults = [result];
            if (openAction !== undefined) {
                state.selectedOpenAction = openAction ? 'open' : 'none';
            }
            query.filter = encodeFilterState(state);

            router.push({ path: '/pipeline/reports', query }).catch(() => {});
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
        // Kept off the reactive state on purpose: it only holds the per-doughnut
        // options objects, which have to keep their identity across renders.
        this.doughnutOptionsCache = {};

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

.attention-chip :deep(.v-icon) {
    opacity: 0.9;
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
