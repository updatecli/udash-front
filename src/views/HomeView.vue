<template>
  <v-container class="page-shell">

    <!-- Hero Section -->
    <section class="pb-8">
      <PageTitle
        hero
        title="Udash"
        subtitle="The Updatecli dashboard for tracking automated updates across your Git repositories."
      />

      <!-- The row sits in the hero rather than in a panel of its own: on a private
           instance it is the only content a signed-out page has, so a border would be
           separating it from nothing. What signing in buys differs by visibility, so the
           copy has to as well. On a public instance the panels below are already there
           and the row must not promise access it is not granting. -->
      <div v-if="isAuthEnabled && !isAuthenticated" class="d-flex align-center flex-wrap ga-4 mt-8">
        <v-btn color="primary" @click="login">Sign in</v-btn>
        <span class="text-medium-emphasis">
          {{ signInHint }}
        </span>
      </div>
    </section>

    <!-- Pipeline Activity Section

         ActivityChart is mounted for any viewer allowed to fetch, but it renders
         nothing until it has reports: an instance that has never reported keeps the
         onboarding page it needs, without a chart of empty days. Gating the section
         rather than its heading is what keeps a signed-out visitor from firing a
         request the API will refuse.

         The section keeps its spacing for as long as the chart is drawing something —
         a spinner and a refusal both occupy the band — and gives it up only once the
         summary has confirmed there is nothing to plot. -->
    <section v-if="canReadData" :class="isKnownEmpty ? '' : 'pt-0 pb-8'">
      <template v-if="hasActivity">
        <h2 class="text-headline-medium font-weight-bold mb-2">Pipeline activity</h2>
        <p class="text-medium-emphasis mb-6">
          Reports received over the last {{ maxHistoryDays }} days
        </p>
      </template>

      <ActivityChart :days="maxHistoryDays" mode="volume" @loaded="onSummaryLoaded"/>
    </section>

    <!-- Get Started Section

         Shown in full only once the summary has come back and confirmed there is
         nothing to report yet. Telling a busy instance to connect its first runner is
         the one mistake worth holding the layout back for, so neither this block nor
         its collapsed form is drawn while the answer is still in flight. Once reports
         are flowing it moves below the feature cards as a collapsed panel. -->
    <section v-if="canReadData && isKnownEmpty" class="pb-8">
      <v-card flat color="background" class="pa-6">
        <v-card-title class="text-headline-medium font-weight-bold px-0 mb-2">Get Started</v-card-title>
        <p class="text-medium-emphasis mb-8">
          Connect your Updatecli runner to Udash in a few steps
        </p>

        <GetStartedSteps/>
      </v-card>
    </section>

    <!-- Features Section -->
    <section v-if="canReadData" class="pb-8">
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
            <v-card-title class="text-title-large px-0 mb-2">{{ feature.title }}</v-card-title>
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
         already reporting: at that point they are only needed to add a runner. A
         refused summary lands here too — the steps stay reachable, without the page
         claiming an instance it could not read is a new one. -->
    <section v-if="showSetupPanel" class="pb-8">
      <v-expansion-panels variant="accordion" flat="true">
        <v-expansion-panel title="Connect another runner">
          <v-expansion-panel-text>
            <GetStartedSteps/>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </section>

  </v-container>
</template>

<script>
import GetStartedSteps from '../components/GetStartedSteps.vue';
import PageTitle from '../components/PageTitle.vue';
import ActivityChart from '../components/pipeline/activityChart.vue';
import { getMaxHistoryDays, isAuthEnabled, requiresLoginToRead } from '@/composables/runtime';
import { useAuth } from '@/composables/auth';

export default {
  name: 'HomeView',
  components: {
    GetStartedSteps,
    PageTitle,
    ActivityChart,
  },
  // The panels below follow canReadData the way SideNavigation does, while the hero
  // follows the session: those are the same thing only on a private instance. main.js
  // resolves auth before mounting, which is why there is no loading state to hold: it is
  // already settled here.
  setup() {
    const auth = useAuth();

    return {
      isAuthEnabled,
      isAuthenticated: auth.isAuthenticated,
      canReadData: auth.canReadData,
      login() {
        auth.login();
      }
    }
  },
  data: () => ({
    // activity holds the last status ActivityChart reported, and stays null until the
    // summary settles. Keeping "not known yet" and "the request was refused" apart from
    // "this instance has never reported" is what the layout below turns on: only the
    // last of the three is evidence that onboarding is what the viewer needs.
    activity: null,

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
    // What a signed-out visitor gains by signing in: the data on a private instance, the
    // account pages on a public one, where the data is already in front of them.
    signInHint() {
      return requiresLoginToRead
        ? 'Pipeline activity and reports need an account.'
        : 'Sign in to manage your profile and API tokens.'
    },

    // The activity band never looks further back than the instance is configured to
    // serve, so lowering MAX_HISTORY_DAYS narrows the chart along with the filter.
    maxHistoryDays() {
      return getMaxHistoryDays()
    },

    hasActivity() {
      return this.activity?.hasData === true
    },

    // isKnownEmpty is the only state the onboarding layout may claim: the summary came
    // back, and it carried no report at all.
    isKnownEmpty() {
      return this.activity !== null && !this.activity.error && !this.activity.hasData
    },

    // A refused summary leaves activity unknown, so the steps stay available as
    // reference material rather than as a first-run instruction.
    showSetupPanel() {
      return this.hasActivity || Boolean(this.activity?.error)
    }
  },
  methods: {
    onSummaryLoaded(status) {
      this.activity = status
    }
  }
}
</script>

