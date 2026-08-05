<template>
  <v-app>
    <HeadNavigation/>
    <SideNavigation/>

    <v-main>
      <v-container class="page-container">

        <!-- Hero Section -->
        <section class="py-8 px-6">
          <h1 class="text-h1 font-weight-bold mb-4">Udash</h1>
          <p class="text-h6 text-medium-emphasis mb-0">
            The Updatecli dashboard for tracking automated updates across your Git repositories.
          </p>
        </section>

        <!-- Pipeline Activity Section

             ActivityChart is always mounted so it can fetch, but it renders nothing
             until it has reports: an instance that has never reported keeps the
             onboarding page it needs, without a chart of empty days. -->
        <section class="px-6" :class="hasActivity ? 'pt-0 pb-8' : ''">
          <template v-if="hasActivity">
            <h2 class="text-h4 font-weight-bold mb-2">Pipeline activity</h2>
            <p class="text-medium-emphasis mb-6">
              Reports received over the last {{ maxHistoryDays }} days
            </p>
          </template>

          <ActivityChart :days="maxHistoryDays" mode="volume" @loaded="onSummaryLoaded"/>
        </section>

        <!-- Get Started Section

             Shown in full only while there is nothing to report yet. Once reports
             are flowing it moves below the feature cards as a collapsed panel. -->
        <section v-if="!hasActivity" class="py-8">
          <v-card flat color="background" class="pa-6">
            <v-card-title class="text-h4 font-weight-bold px-0 mb-2">Get Started</v-card-title>
            <p class="text-medium-emphasis mb-8">
              Connect your Updatecli runner to Udash in a few steps
            </p>

            <GetStartedSteps/>
          </v-card>
        </section>

        <!-- Features Section -->
        <section class="pt-0 pb-8 px-6">
          <v-row>
            <v-col
              v-for="feature in features"
              :key="feature.title"
              cols="12"
              md="6"
            >
              <v-card
                :to="feature.to"
                height="100%"
                variant="outlined"
                hover
                class="pa-4 d-flex flex-column"
              >
                <v-icon :icon="feature.icon" size="48" class="mb-4"></v-icon>
                <v-card-title class="text-h6 px-0 mb-2">{{ feature.title }}</v-card-title>
                <v-card-text class="px-0">{{ feature.description }}</v-card-text>
                <v-card-actions class="px-0 mt-auto text-info">
                  <span class="font-weight-medium">{{ feature.cta }}</span>
                  <v-icon icon="mdi-arrow-right" size="small" class="ml-1"></v-icon>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </section>

        <!-- Setup steps, demoted to reference material once this instance is
             already reporting: at that point they are only needed to add a runner. -->
        <section v-if="hasActivity" class="pt-0 pb-8 px-6">
          <v-expansion-panels variant="accordion" flat="true">
            <v-expansion-panel title="Connect another runner">
              <v-expansion-panel-text>
                <GetStartedSteps/>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </section>

      </v-container>
    </v-main>

    <ReleaseFooter/>
  </v-app>
</template>

<script>
import ReleaseFooter from '../components/ReleaseFooter.vue';
import SideNavigation from '../components/SideNavigation.vue';
import HeadNavigation from '../components/HeadNavigation.vue';
import GetStartedSteps from '../components/GetStartedSteps.vue';
import ActivityChart from '../components/pipeline/activityChart.vue';
import { getMaxHistoryDays } from '@/composables/runtime';

export default {
  name: 'HomeView',
  components: {
    ReleaseFooter,
    SideNavigation,
    HeadNavigation,
    GetStartedSteps,
    ActivityChart,
  },
  data: () => ({
    // hasActivity stays false while the summary is loading and whenever it could
    // not be retrieved, so the page falls back to its onboarding layout instead of
    // showing a broken widget to a first-time visitor.
    hasActivity: false,

    features: [
      {
        title: "Dashboard",
        icon: "mdi-view-dashboard",
        description: "Visualize update status by Git repository with visual overviews.",
        to: "/scm/dashboard",
        cta: "Open Dashboard"
      },
      {
        title: "Reports",
        icon: "mdi-book-open-variant",
        description: "Search pipelines by Git repository and branch for audit or debugging purposes.",
        to: "/pipeline/reports",
        cta: "View Reports"
      },
    ],
  }),
  computed: {
    // The activity band never looks further back than the instance is configured to
    // serve, so lowering MAX_HISTORY_DAYS narrows the chart along with the filter.
    maxHistoryDays() {
      return getMaxHistoryDays()
    }
  },
  methods: {
    onSummaryLoaded(summary) {
      this.hasActivity = Boolean(summary)
    }
  }
}
</script>

<style scoped>
/* Single shared wrapper so the hero, Get Started, and card row share one
   left/right edge (Vuetify's default v-container maxes out much wider). */
.page-container {
  max-width: 1100px;
}
</style>
