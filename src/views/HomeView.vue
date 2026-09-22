<template>
  <v-container class="page-shell">

    <!-- Hero Section -->
    <section class="pb-8">
      <PageTitle
        hero
        title="Udash"
        subtitle="The Updatecli dashboard for tracking automated updates across your Git repositories."
      />

      <!-- Only on a private instance, where it is the only content a signed-out page has.
           Elsewhere the app bar's Log in button is enough. -->
      <div v-if="requiresLoginToRead && !isAuthenticated" class="d-flex align-center flex-wrap ga-4 mt-8">
        <v-btn color="primary" @click="login">Log in</v-btn>
        <span class="text-medium-emphasis">
          Pipeline activity and reports need an account.
        </span>
      </div>
    </section>

    <!-- What needs a human, before the activity overview: this is what someone opening
         Udash every morning comes for. Not shown to an instance that has never reported. -->
    <section v-if="canReadData && !isKnownEmpty" class="pb-8" aria-labelledby="needs-attention">
      <h2 id="needs-attention" class="text-headline-medium font-weight-bold mb-4">Needs attention</h2>
      <TodayQueue />
    </section>

    <!-- Pipeline Activity Section

         ActivityChart is mounted for any viewer allowed to fetch, but it renders
         nothing until it has reports. An instance that has never reported keeps the
         onboarding page it needs, without a chart of empty days. We hide the whole
         section, and not only its heading, so a signed-out visitor never sends a
         request the API will refuse.

         The section keeps its spacing while the chart shows something (a spinner or a
         refusal message), and drops it only once the summary confirms there is
         nothing to plot. -->
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
         nothing to report yet. We do not want to tell a busy instance to connect its
         first runner, so neither this block nor its collapsed form is drawn while the
         request is still in flight. Once reports arrive, it moves below the feature
         cards as a collapsed panel. -->
    <section v-if="canReadData && isKnownEmpty" class="pb-8">
      <v-card flat color="background" class="pa-6">
        <v-card-title class="text-headline-medium font-weight-bold px-0 mb-2">Get started</v-card-title>
        <p class="text-medium-emphasis mb-8">
          Connect your Updatecli runner to Udash in three steps
        </p>

        <GetStartedSteps/>
      </v-card>
    </section>

    <!-- Setup steps, kept as reference once this instance is already reporting.
         At that point they are only needed to add a runner. A refused summary also
         lands here, so the steps stay reachable without the page calling an instance
         it could not read a new one. -->
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
import TodayQueue from '../components/TodayQueue.vue';
import { defineAsyncComponent } from 'vue';
import { getMaxHistoryDays, requiresLoginToRead } from '@/composables/runtime';
import { useAuth } from '@/composables/auth';

const ActivityChart = defineAsyncComponent(() => import('../components/pipeline/activityChart.vue'));

export default {
  name: 'HomeView',
  components: {
    GetStartedSteps,
    PageTitle,
    TodayQueue,
    ActivityChart,
  },
  // The panels below follow canReadData the way SideNavigation does, while the hero
  // follows the session: those are the same thing only on a private instance. main.js
  // resolves auth before mounting, which is why there is no loading state to hold: it is
  // already settled here.
  setup() {
    const auth = useAuth();

    return {
      requiresLoginToRead,
      isAuthenticated: auth.isAuthenticated,
      canReadData: auth.canReadData,
      login() {
        auth.login();
      }
    }
  },
  data: () => ({
    // activity holds the last status ActivityChart reported, and stays null until the
    // summary settles. The layout below keeps "not known yet" and "the request was
    // refused" apart from "this instance has never reported". Only the last one means
    // the viewer needs onboarding.
    activity: null,

  }),
  computed: {
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

