<template>
  <!-- While the first request is in flight we only reserve the plot height, so the
       host does not have to know anything about the loading state. -->
  <div
    v-if="loading && !summary"
    class="d-flex align-center justify-center"
    :style="{ height }"
  >
    <v-progress-circular indeterminate color="primary" size="32" />
  </div>

  <!-- Nothing is rendered when the request failed or returned no report at all:
       a host page stays exactly as it would be without this component. -->
  <div v-else-if="hasData" class="activity-chart" :class="{ 'activity-chart--refreshing': loading }">
    <p v-if="showStats" class="text-body-2 text-medium-emphasis mb-3">
      <span class="font-weight-medium text-high-emphasis">{{ formatCount(stats.total) }}</span>
      {{ stats.total === 1 ? 'report' : 'reports' }}
      &middot;
      <span class="font-weight-medium text-high-emphasis">{{ stats.successRate }}%</span>
      success
      &middot;
      <span class="font-weight-medium text-high-emphasis">{{ formatCount(stats.failures) }}</span>
      {{ stats.failures === 1 ? 'failure' : 'failures' }}
    </p>

    <div v-if="canPlot" :style="{ height }">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>

  <!-- A refused request is reported where the plot would be. Everything else still
       renders nothing, so a host page stays exactly as it would be without this
       component. -->
  <p v-else-if="error" class="text-caption text-medium-emphasis mb-0">
    {{ error }}
  </p>
</template>

<script>
import { Bar } from 'vue-chartjs'

import {
  Chart as ChartJS,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'

import { apiFetch } from '@/composables/api';

// Register chart parts and plugin
ChartJS.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

// RESULT_SERIES lists every result the summary endpoint reports, in stack order:
// the first entry sits on the baseline. Errors go first because only the segment
// anchored to the axis can be compared accurately from one bar to the next.
//
// It is used in both modes: "results" stacks one dataset per entry, and "volume"
// still borrows its order and labels for the tooltip breakdown.
//
// The colours are the ones _summary.vue already uses for its doughnuts, so both
// charts read as one system. They are used solid rather than at 0.7 alpha:
// compositing them over the page background drops green and amber below the 3:1
// contrast floor. Red and amber stay close under deuteranopia, which is why every
// label carries its result glyph — identity is never left to colour alone.
//
// The success bucket is split in two. A pipeline which had nothing to change reports a
// success even when the change it would have made is already waiting in a pull request
// nobody merged, so lumping both together buries the ones needing a human under the ones
// which are genuinely up to date. The split is drawn below plain success, next to the
// other results worth acting on, in the blue forges use for an open pull request — a hue
// none of the other segments occupies.
const RESULT_SERIES = Object.freeze([
    { key: '✗',       label: '✗ Error',   color: '#dc2626' }, // Red
    { key: '⚠',       label: '⚠ Warning', color: '#f59e0b' }, // Amber
    { key: '✔:open',  label: '✔ Waiting to be merged', color: '#3b82f6', result: '✔', openAction: true }, // Blue
    { key: '✔',       label: '✔ Success', color: '#10b981', result: '✔', openAction: false }, // Green
    { key: '-',       label: '- Skipped', color: '#6b7280' }, // Gray
    { key: 'unknown', label: '? Unknown', color: '#8b5cf6' }, // Purple
]);

// seriesCount reads what a series contributes to a bucket. open_actions is a breakdown of
// results rather than an addition to it, so the plain success segment is what is left once
// the ones waiting on a pull request are taken out, and the two together still add up to
// the success count the API reported.
function seriesCount(entry, serie) {
    const total = entry?.results?.[serie.result || serie.key] || 0;

    if (serie.openAction === undefined) {
        return total;
    }

    const open = entry?.open_actions?.[serie.result] || 0;

    return serie.openAction ? open : Math.max(total - open, 0);
}

// VOLUME_COLOR is pinned rather than read from the theme. It is the light theme's
// primary, and it is the one step that clears every check against *both* chart
// surfaces; the dark theme's own primary (#39FFB6) passes contrast but is far too
// light to carry a large filled mark without glowing.
const VOLUME_COLOR = '#0E9F6E';

// MIN_PLOT_BUCKETS is how many buckets a window must cover before the bars are worth
// drawing. Below it there is no shape to read — two columns are a comparison, not a
// trend — so the plot is dropped and the summary line carries the window on its own.
const MIN_PLOT_BUCKETS = 3;

// Thresholds for granularity: 'auto' picks the bucket size that keeps the number of
// bars readable for the requested span. Two days is where hourly stops: it keeps the
// filter's default window (the last day) at 24 bars, and 48 is still readable under
// the axis thinning below.
const AUTO_GRANULARITY_HOUR_MAX_DAYS = 2;
const AUTO_GRANULARITY_DAY_MAX_DAYS = 60;
const AUTO_GRANULARITY_WEEK_MAX_DAYS = 180;

// GRANULARITY_LADDER runs from the finest bucket to the coarsest. It is both the order
// 'auto' walks and the order the bucket guard falls back along.
const GRANULARITY_LADDER = ['hour', 'day', 'week', 'month'];

// GRANULARITY_DAYS is the length of a bucket in days, used to estimate how many buckets
// a span produces. A month is counted as its shortest possible length so the estimate
// errs high and never lets through a request the API would then reject.
const GRANULARITY_DAYS = Object.freeze({
    hour: 1 / 24,
    day: 1,
    week: 7,
    month: 28,
});

// MAX_SUMMARY_BUCKETS mirrors the API's own maxSummaryBuckets. Exceeding it is a 400,
// and with hourly buckets an ordinary filter selection can reach it — a 60 day window
// is 1441 hours. Coarsening here rather than sending the request follows what
// getMaxHistoryDays already does with the API's day ceiling.
const MAX_SUMMARY_BUCKETS = 1000;

// hexToRgba fades a theme colour so grid lines and ticks stay recessive against
// the surface in both themes.
function hexToRgba(hex, alpha) {
    const value = String(hex || '').replace('#', '');
    if (value.length !== 3 && value.length !== 6) {
        return `rgba(128, 128, 128, ${alpha})`;
    }

    const full = value.length === 3
        ? value.split('').map((c) => c + c).join('')
        : value;

    const int = parseInt(full, 16);

    return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${alpha})`;
}

export default {
    name: 'PipelineActivityChart',

    components: {
        Bar,
    },

    props: {
        // mode picks what the bars encode:
        //   volume  - one bar per bucket showing how many reports arrived. Answers
        //             "are reports coming in?", and a bucket with none is a visible
        //             hole in the series.
        //   results - the same buckets stacked by Updatecli result. Use it where the
        //             mix matters more than the volume, e.g. next to a filter.
        mode: {
            type: String,
            default: 'volume',
            validator: (value) => ['volume', 'results'].includes(value),
        },

        // days is the size of the window to summarize, today included. Ignored when
        // hours is set, and by the backend when startTime and endTime are both provided.
        days: {
            type: Number,
            default: 7,
        },

        // hours is the size of the window in hours, the current hour included. It takes
        // precedence over days, which the API refuses to receive alongside it. Use it
        // for windows shorter than a day rather than a fractional days value.
        hours: {
            type: Number,
            default: 0,
        },

        // granularity is the size of the time buckets: hour, day, week or month, or
        // "auto" to derive it from the requested span so a long window does not turn
        // into hundreds of bars. Whatever is asked for, it is coarsened when the span
        // would produce more buckets than the API returns.
        granularity: {
            type: String,
            default: 'day',
        },

        // startTime and endTime must be provided together, formatted the way
        // stepToISO in @/composables/date builds them.
        startTime: {
            type: String,
            default: '',
        },

        endTime: {
            type: String,
            default: '',
        },

        scmid: {
            type: String,
            default: '',
        },

        labels: {
            type: Object,
            default: null,
        },

        // results restricts the summary to those pipeline results. In "results" mode
        // the plot keeps stacking, with only the selected results left to stack.
        results: {
            type: Array,
            default: null,
        },

        // openAction restricts the summary to the pipelines carrying an action left open,
        // such as a pull request still waiting to be merged, when true, or to the ones
        // without when false. Null leaves both in, which is what makes the success bucket
        // splittable: the breakdown is reported whether or not it is filtered on.
        openAction: {
            type: Boolean,
            default: null,
        },

        // showStats toggles the summary line above the plot. It is what makes a
        // handful of failures readable when they are too few to occupy a pixel.
        showStats: {
            type: Boolean,
            default: true,
        },

        // compact strips the axes and grid so the bars read as a sparkline. Use it
        // where the chart is a detail inside a denser layout and the shape matters
        // more than the exact values, which the tooltip still carries.
        compact: {
            type: Boolean,
            default: false,
        },

        height: {
            type: String,
            default: '240px',
        },
    },

    emits: ['loaded'],

    data: () => ({
        summary: null,
        loading: false,
        error: null,
        currentRequestId: 0,
    }),

    computed: {
        entries() {
            return this.summary?.data || [];
        },

        hasData() {
            return this.entries.length > 0 && (this.summary?.total_count || 0) > 0;
        },

        // canPlot decides whether the bars are drawn. A narrow window still produces a
        // useful summary line, so the stats stay and only the plot is dropped.
        canPlot() {
            return this.entries.length >= MIN_PLOT_BUCKETS;
        },

        // resolvedGranularity turns "auto" into a real bucket size, then holds whatever
        // was asked for to the API's bucket ceiling.
        resolvedGranularity() {
            const spanDays = this.requestedSpanDays;

            const preferred = this.granularity === 'auto'
                ? this.autoGranularity(spanDays)
                : this.granularity;

            return this.withinBucketLimit(preferred, spanDays);
        },

        // requestedSpanDays is the width of the window in days. Explicit ranges yield a
        // fractional count, which is what lets a six hour window resolve to hourly.
        requestedSpanDays() {
            if (!this.startTime || !this.endTime) {
                return this.hours > 0 ? this.hours / 24 : this.days;
            }

            // The times arrive as "YYYY-MM-DD HH:mm:ss±HH:MM"; swapping the space for a
            // T makes them valid ISO 8601, which Date parses consistently.
            const start = new Date(this.startTime.replace(' ', 'T'));
            const end = new Date(this.endTime.replace(' ', 'T'));

            if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
                return null;
            }

            return Math.abs(end - start) / (1000 * 60 * 60 * 24);
        },

        // activeSeries drops the results that never occurred over the whole range.
        // Most instances only ever emit ✔, ⚠ and ✗, and "unknown" only shows up for
        // reports stored before the result column was backfilled — keeping those in
        // the legend costs clarity and buys nothing. Colour is bound to the result
        // key rather than to a position, so dropping one never repaints the others.
        activeSeries() {
            return RESULT_SERIES.filter(
                (serie) => this.entries.some((entry) => seriesCount(entry, serie) > 0)
            );
        },

        stats() {
            const total = this.summary?.total_count || 0;

            let success = 0;
            let failures = 0;

            this.entries.forEach((entry) => {
                success += entry.results?.['✔'] || 0;
                failures += entry.results?.['✗'] || 0;
            });

            return {
                total,
                failures,
                successRate: total > 0 ? Math.round((success / total) * 100) : 0,
            };
        },

        chartData() {
            const labels = this.entries.map((entry) => this.formatBucketDate(entry.date));

            if (this.mode === 'volume') {
                return {
                    labels,
                    datasets: [{
                        label: 'Reports',
                        // entry.total comes from the API rather than being summed from
                        // results, so the bar and the tooltip breakdown can never disagree.
                        data: this.entries.map((entry) => entry.total || 0),
                        backgroundColor: VOLUME_COLOR,
                        borderRadius: { topLeft: 4, topRight: 4 },
                        borderSkipped: false,
                        // No surface gap here: nothing is stacked, and neighbouring bars
                        // are already held apart by the bar/category spacing.
                        barPercentage: 0.7,
                        categoryPercentage: 0.8,
                        maxBarThickness: 24,
                    }],
                };
            }

            const series = this.activeSeries;
            const surface = this.themeColors.surface;

            return {
                labels,
                datasets: series.map((serie, index) => ({
                    label: serie.label,
                    data: this.entries.map((entry) => seriesCount(entry, serie)),
                    backgroundColor: serie.color,
                    stack: 'results',
                    // A 2px slice of the surface separates the segments instead of a
                    // border drawn around them.
                    borderColor: surface,
                    borderWidth: { top: 2 },
                    borderSkipped: false,
                    // Only the top of the stack is rounded, so the bar reads as one
                    // mark with a single rounded end rather than a pile of pills.
                    borderRadius: index === series.length - 1
                        ? { topLeft: 4, topRight: 4 }
                        : 0,
                    barPercentage: 0.7,
                    categoryPercentage: 0.8,
                    maxBarThickness: 24,
                })),
            };
        },

        chartOptions() {
            const { grid, tick } = this.themeColors;
            const stacked = this.mode === 'results';

            return {
                responsive: true,
                maintainAspectRatio: false,
                // A sparkline gives its whole height to the bars: with a strip this
                // short an axis band would leave the marks a few pixels to live in.
                layout: this.compact ? { padding: { top: 2, bottom: 2 } } : {},
                scales: {
                    x: {
                        stacked,
                        display: !this.compact,
                        grid: { display: false },
                        border: { color: grid },
                        // A long window would otherwise collide or clip its date labels;
                        // thinning them keeps the axis readable and the tooltip carries
                        // the days that lose their tick.
                        ticks: {
                            color: tick,
                            autoSkip: true,
                            maxTicksLimit: 8,
                            maxRotation: 0,
                        },
                    },
                    y: {
                        stacked,
                        display: !this.compact,
                        beginAtZero: true,
                        grid: { color: grid },
                        border: { display: false },
                        ticks: { color: tick, precision: 0 },
                    },
                },
                plugins: {
                    legend: {
                        // A single series needs no legend: the section heading already
                        // names what is plotted, and a one-swatch box just restates it.
                        display: stacked,
                        position: 'bottom',
                        labels: {
                            color: tick,
                            usePointStyle: true,
                            boxWidth: 8,
                            boxHeight: 8,
                        },
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: stacked ? {} : {
                            label: (ctx) => {
                                const count = ctx.parsed.y || 0;
                                return ` ${count.toLocaleString()} ${count === 1 ? 'report' : 'reports'}`;
                            },
                            // Volume mode drops the per-result stack, so the breakdown
                            // moves here — at no cost in chart chrome. Zero results are
                            // skipped so a clean day shows one line rather than five.
                            afterBody: (items) => {
                                const entry = this.entries[items[0]?.dataIndex];
                                if (!entry) return '';

                                const parts = RESULT_SERIES
                                    .filter((serie) => seriesCount(entry, serie) > 0)
                                    .map((serie) => `${serie.key} ${seriesCount(entry, serie)}`);

                                return parts.length ? parts.join('  ') : '';
                            },
                        },
                    },
                },
            };
        },

        // themeColors follows ThemeSwitcher rather than hard-coding light-mode chrome.
        themeColors() {
            const colors = this.$vuetify.theme.current.colors;
            const ink = colors['on-background'] || colors['on-surface'] || '#000000';

            return {
                surface: colors.background,
                grid: hexToRgba(ink, 0.12),
                tick: hexToRgba(ink, 0.6),
            };
        },
    },

    watch: {
        days: 'fetchSummary',
        hours: 'fetchSummary',
        granularity: 'fetchSummary',
        startTime: 'fetchSummary',
        endTime: 'fetchSummary',
        scmid: 'fetchSummary',
        labels: {
            handler: 'fetchSummary',
            deep: true,
        },
        results: {
            handler: 'fetchSummary',
            deep: true,
        },
        openAction: 'fetchSummary',
    },

    mounted() {
        this.fetchSummary();
    },

    methods: {
        formatCount(value) {
            return Number(value || 0).toLocaleString();
        },

        // autoGranularity picks the bucket size that keeps a span readable. A null span
        // means the window is not known here, so it keeps the previous default.
        autoGranularity(spanDays) {
            if (spanDays === null) {
                return 'day';
            }

            if (spanDays <= AUTO_GRANULARITY_HOUR_MAX_DAYS) {
                return 'hour';
            }

            if (spanDays <= AUTO_GRANULARITY_DAY_MAX_DAYS) {
                return 'day';
            }

            return spanDays <= AUTO_GRANULARITY_WEEK_MAX_DAYS ? 'week' : 'month';
        },

        // withinBucketLimit steps a granularity coarser until the span fits the number of
        // buckets the API is willing to return. An unknown value is left alone so it
        // still reaches the API, which names it in its error.
        withinBucketLimit(granularity, spanDays) {
            let index = GRANULARITY_LADDER.indexOf(granularity);

            if (index < 0 || spanDays === null) {
                return granularity;
            }

            // The API walks its buckets inclusively, so a span covers one more bucket
            // than it spans bucket lengths.
            while (index < GRANULARITY_LADDER.length - 1
                && (spanDays / GRANULARITY_DAYS[GRANULARITY_LADDER[index]]) + 1 > MAX_SUMMARY_BUCKETS) {
                index += 1;
            }

            return GRANULARITY_LADDER[index];
        },

        // formatBucketDate turns a bucket start into an axis label. Every bucket arrives
        // as RFC3339 in UTC ("2026-08-04T13:00:00Z") whatever the granularity, because
        // the time of day is what keeps hourly buckets distinct from one another.
        formatBucketDate(date) {
            // The response echoes the granularity it actually used, which is the
            // authoritative answer when "auto" was requested.
            const granularity = this.summary?.granularity || this.resolvedGranularity;

            const parsed = new Date(date);
            if (Number.isNaN(parsed.getTime())) {
                return date;
            }

            // An hour bucket marks a moment rather than a calendar unit, so it reads in
            // the viewer's own zone: activity "at 15:00" should mean their 15:00. Zones
            // offset by a fraction of an hour land on :30 or :45, which is where the
            // bucket really falls for them and not a rounding error to correct.
            if (granularity === 'hour') {
                return parsed.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                });
            }

            // Days, weeks and months are calendar units the API already resolved in UTC.
            // Rendering them in the viewer's zone would move every label to the previous
            // day for anyone west of UTC.
            if (granularity === 'month') {
                return parsed.toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                    timeZone: 'UTC',
                });
            }

            const day = parsed.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                timeZone: 'UTC',
            });

            return granularity === 'week' ? `Week of ${day}` : day;
        },

        buildRequestBody() {
            const body = {
                metric: 'result',
                granularity: this.resolvedGranularity,
            };

            // Exactly one window travels with the request: the backend rejects a
            // half-specified range, and rejects days and hours arriving together.
            if (this.startTime && this.endTime) {
                body.start_time = this.startTime;
                body.end_time = this.endTime;
            } else if (this.hours > 0) {
                body.hours = this.hours;
            } else {
                body.days = this.days;
            }

            if (this.scmid) {
                body.scmid = this.scmid;
            }

            if (this.labels && typeof this.labels === 'object' && !Array.isArray(this.labels)) {
                const labels = {};
                Object.entries(this.labels).forEach(([key, value]) => {
                    if (typeof key === 'string' && value !== undefined && value !== null) {
                        labels[key] = String(value);
                    }
                });

                if (Object.keys(labels).length > 0) {
                    body.labels = labels;
                }
            }

            if (Array.isArray(this.results) && this.results.length > 0) {
                body.results = this.results;
            }

            // Tri-state: an unset filter has to stay absent from the body rather than be
            // sent as false, which would drop every pipeline with an open pull request.
            if (typeof this.openAction === 'boolean') {
                body.open_action = this.openAction;
            }

            return body;
        },

        async fetchSummary() {
            this.currentRequestId += 1;
            const requestId = this.currentRequestId;

            this.loading = true;
            this.error = null;

            try {
                // apiFetch surfaces the sentence the API puts in the body of a rejection.
                // Now that a window and a granularity can be refused together, that
                // sentence is the only thing telling the reader why the plot is missing.
                const responseData = await apiFetch('/pipeline/reports/summary', {
                    method: 'POST',
                    body: this.buildRequestBody(),
                });

                // Discard stale results if the props changed while fetching
                if (requestId !== this.currentRequestId) return;

                this.summary = responseData;
                this.$emit('loaded', this.hasData ? responseData : null);
            } catch (error) {
                if (requestId !== this.currentRequestId) return;

                // A summary is still supporting information, so the host keeps rendering
                // and is told there is no data. The reason is shown in place of the plot
                // rather than only logged: a blank strip reads as "no activity", which is
                // the wrong conclusion when the window was simply refused.
                console.error('fetching pipeline reports summary:', error);
                this.error = error.message || 'summary unavailable';
                this.summary = null;
                this.$emit('loaded', null);
            } finally {
                if (requestId === this.currentRequestId) {
                    this.loading = false;
                }
            }
        },
    },
}
</script>

<style scoped>
/* On a refetch the previous chart is held at reduced opacity rather than being
   replaced by a spinner, so the surrounding layout never jumps. */
.activity-chart--refreshing {
    opacity: 0.5;
}

.activity-chart {
    transition: opacity 0.2s ease;
}
</style>
