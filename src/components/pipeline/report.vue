<template>
  <v-container
    v-if="pipeline"
  >
      <v-overlay
      :model-value="isLoading"
      class="align-center justify-center"
      :disabled="true"
      :eager="true"
      :no-click-animation="true"
      :persistent="true"
      :opacity="0"
    >
      <v-progress-circular
        color="black"
        indeterminate
        size="64"
      ></v-progress-circular>
    </v-overlay>

    <v-row>
      <v-col
        class="text-right"
        cols="auto"
        lg="8"
        md="8"
        sm="12"
      >
        <h1>
          Report <v-icon icon="mdi-book-open-variant"></v-icon>
        </h1>
      </v-col>
      <v-col
        class="text-left"
      >
        <h1>
          {{ pipeline.Pipeline.Name }}
        </h1>
      </v-col>
    </v-row>
  </v-container>
  <v-container
    v-if="pipeline"
  >
    <!-- Show metadata -->
    <v-row>
      <v-col>
        <v-card
          variant="flat"
        >
          <v-card-text>
            <v-table density>
              <tbody>
                <tr>
                  <td>Result</td>
                  <td><v-icon
                      :icon="getStatusIcon(pipeline.Pipeline.Result)"
                      :color="getStatusColor(pipeline.Pipeline.Result)"
                      size="large"
                      ></v-icon></td>
                </tr>
                <tr>
                  <td>Time</td>
                  <td>{{ pipeline.Updated_at }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Show link to latest report -->
     <v-row
        v-if="latestReportByID"
     >
      <v-col>
        <v-card
          variant="outlined"
          v-show="!isLatestReport()"
        >
          <v-card-title>
            Newer report detected
          </v-card-title>

          <v-card-text>
            <p>
              Updated at {{ latestReportByID.Updated_at }}
            </p>
              <v-icon :icon="getStatusIcon(latestReportByID.Pipeline.Result)" :color="getStatusColor(latestReportByID.Pipeline.Result)"></v-icon>  {{ latestReportByID.Pipeline.Name }}
              <v-btn
                icon="mdi-arrow-right-circle"
                variant="flat"
                :to=getPipelineReportLink(latestReportByID.ID)>
              </v-btn>
          <v-divider></v-divider>
          </v-card-text>
        </v-card>
      </v-col>
     </v-row>

    <v-row>
      <v-col
        cols="auto"
        lg="12"
        md="12"
        sm="12"
      >

        <v-container
          class="d-flex justify-center align-center"
        >
          <v-btn-toggle v-model="resourceStage">
            <v-btn
              v-if="isSources()"
              variant="text"
              value="source"
              :class="{ 'v-btn--active': stage === 'source' }"
            >Source</v-btn>
            <v-btn
              v-if="isConditions()"
              variant="text"
              value="condition"
              :class="{ 'v-btn--active': stage === 'condition' }"
            >Condition</v-btn>
            <v-btn
              v-if="isTargets()"
              variant="text"
              value="target"
              :class="{ 'v-btn--active': stage === 'target' }"
            >Target</v-btn>
            <v-btn
              v-if="isActions()"
              variant="text"
              value="action"
              :class="{ 'v-btn--active': stage === 'target' }"
            >Action</v-btn>
          </v-btn-toggle>
        </v-container>

        <!-- Show Sources -->
        <v-card
          variant="outlined"
          v-if="isSources() && resourceStage === 'source'"
        >
          <v-card-text>
              <v-card
                variant="flat"
                v-for="(data, key) in pipeline.Pipeline.Sources" :key="key"
              >
                <SourceComponent
                  :id="key"
                  :data="data"
                ></SourceComponent>
              </v-card>
          </v-card-text>
        </v-card>

        <!-- Show Conditions -->
        <v-card
          variant="outlined"
          v-if="isConditions() && resourceStage === 'condition'"
        >
          <v-card-text>
              <v-card
                variant="flat"
                v-for="(data, key) in pipeline.Pipeline.Conditions" :key="key"
              >
                <ConditionComponent
                  :id="key"
                  :data="data"
                ></ConditionComponent>
              </v-card>
          </v-card-text>
        </v-card>

        <!-- Show Targets -->
        <v-card
          variant="outlined"
          v-if="isTargets() && resourceStage === 'target'"
        >
          <v-card-text>
              <v-card
                v-for="(data, key) in pipeline.Pipeline.Targets" :key="key"
                variant="flat"
              >
                <TargetComponent
                  :id="key"
                  :data="data"
                ></TargetComponent>
              </v-card>
          </v-card-text>
        </v-card>
        <!-- Show Actions -->
        <v-card
          variant="outlined"
          v-if="isActions() && resourceStage === 'action'"
        >
          <v-card-text>
              <v-card
                variant="flat"
                v-for="(data, key) in pipeline.Pipeline.Actions" :key="key"
              >
                <ActionComponent
                  :id="key"
                  :data="data"
                ></ActionComponent>
              </v-card>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import ActionComponent from './_action.vue';
import SourceComponent from './_source.vue';
import ConditionComponent from './_condition.vue';
import TargetComponent from './_target.vue';

import { getStatusColor, getStatusIcon } from '@/composables/status';

import { UDASH_API_VERSION } from '@/constants';

export default {
  name: 'PipelineReportView',

  components: {
    ActionComponent,
    SourceComponent,
    ConditionComponent,
    TargetComponent,
  },

  data: () => ({
    isLoading: true,
    resourceStage: "source",
    pipeline: {
      "Pipeline": {}
    },
    latestReportByID: {
      "Pipeline": {}
    },
  }),

  beforeUnmount() {
    this.cancelAutoUpdate();
  },

  methods: {

    getDefaultStage(){
      if (this.isActions()) {
        return "action"
      } else if (this.isSources()) {
        return "source"
      } else if (this.isConditions()) {
        return "condition"
      } else if (this.isTargets()) {
        return "target"
      }

      return "source";
    },

    isActions(){
      for (const action in this.pipeline.Pipeline.Actions) {
        if (this.pipeline.Pipeline.Actions[action].actionUrl !== undefined){
          return true
        }
      }
      return false;
    },

    isLatestReport(){
      if (this.latestReportByID !== null) {
        return this.latestReportByID.ID == this.pipeline.ID
      }
      return ""
    },

    isConditions(){
      for (const condition in this.pipeline.Pipeline.Conditions) {
        return true
      }
      return false;
    },

    isSources(){
      for (const source in this.pipeline.Pipeline.Sources) {
        return true
      }
      return false;
    },

    isTargets(){
      for (const target in this.pipeline.Pipeline.Targets) {
        return true
      }
      return false;
    },

    getPipelineReportLink: function(id){
      return "/pipeline/reports/" + id
    },

    cancelAutoUpdate() {
      clearInterval(this.timer);
    },

    getStatusColor: function(input){
      return getStatusColor(input);
    },

    getStatusIcon: function(status){
      return getStatusIcon(status);
    },

    async getPipelineReportData() {
      const isAuthEnabled = process.env.VUE_APP_AUTH_ENABLED === 'true';
      if (isAuthEnabled) {
        const token = await this.$auth0.getAccessTokenSilently();
        const response = await fetch(`/api/${ UDASH_API_VERSION }/pipeline/reports/` + this.$route.params.id, {
            headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();

        this.pipeline = data.data;
        this.isLoading = false;

        if (this.pipeline !== null) {
          this.latestReportByID = data.latestReportByID
          this.isLatestReport()
        }
      } else {
        const response = await fetch(`/api/${ UDASH_API_VERSION }/pipeline/reports/` + this.$route.params.id);
        const data = await response.json();

        this.pipeline = data.data;
        this.isLoading = false;

        if (this.pipeline !== null) {
          this.latestReportByID = data.latestReportByID
          this.isLatestReport()
        }
      }

      this.resourceStage = this.getDefaultStage();
    },
  },

  watch: {
      isLoading (val) {
        val && setTimeout(() => {
          this.isLoading = false
        }, 3000)
      },
  },

  async created() {
    /*
      One thing to note when using routes with params is that
      when the user navigates from /users/johnny to /users/jolyne,
      the same component instance will be reused.
      Since both routes render the same component,
      this is more efficient than destroying the old instance and then creating a new one. However, this also means that the lifecycle hooks of the component will not be called.
    */
    this.$watch(
      () => this.$route.params,
      (toParams, previousParams) => {
        if (toParams.id != previousParams.id) {
          try {
            this.getPipelineReportData()
          } catch (error) {
            console.log(error);
          }
        }
      }
    )
    try {
      this.getPipelineReportData()
    } catch (error) {
      console.log(error);
    }
  },
}
</script>
