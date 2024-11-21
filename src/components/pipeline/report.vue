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
          Report <v-icon icon="mdi-satellite-variant"></v-icon>
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
    <v-row>
      <v-col
        cols="auto"
        lg="8"
        md="8"
        sm="12"
      >
        <!-- Show Sources -->
        <v-card
          variant="outlined"
          v-if="isSources()"
        >
          <v-card-title><h4>Source</h4></v-card-title>
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

        <v-divider
          v-if="isConditions()"
          :color="getStatusColor(pipeline.Pipeline.Result)"
          thickness="30"></v-divider>

        <!-- Show Conditions -->
        <v-card
          variant="outlined"
          v-if="isConditions()"
        >
          <v-card-title><h4>Condition</h4></v-card-title>
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

        <v-divider
          v-if="isTargets()"
          :color="getStatusColor(pipeline.Pipeline.Result)"
          thickness="30"></v-divider>

        <!-- Show Targets -->
        <v-card
          variant="outlined"
          v-if="isTargets()"
        >
          <v-card-title>
            <h4>Target</h4>
          </v-card-title>
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
      </v-col>
      <v-col
        class="text-left"
        cols="auto"
        lg="4"
        md="4"
        sm="12"
      >
        <v-card
          variant="outlined"
        >
          <v-card-title>
            Metadata
          </v-card-title>
          <v-card-text>
            <v-row
            >
              <v-col>State</v-col><v-col><v-icon icon="mdi-circle" :color="getStatusColor(pipeline.Pipeline.Result)"></v-icon></v-col>
            </v-row>
            <v-row>
              <v-col>Created At</v-col><v-col>{{ pipeline.Created_at }}</v-col>
            </v-row>
            <v-row>
              <v-col>Updated At</v-col><v-col>{{ pipeline.Updated_at }}</v-col>
            </v-row>
          </v-card-text>
        </v-card>
        <v-divider
          :color="getStatusColor(pipeline.Pipeline.Result)"
          v-show="!isLatestReport()"
          thickness="30"></v-divider>
        <v-card
          variant="outlined"
          v-show="!isLatestReport()"
          v-if="latestReportByID"
        >
          <v-card-title>
            Newer report detected
          </v-card-title>

          <v-card-text>
            <p>
              Updated at {{  latestReportByID.Updated_at }}
            </p>
              <v-icon icon="mdi-circle" :color="getStatusColor(latestReportByID.Pipeline.Result)"></v-icon>  {{ latestReportByID.Pipeline.Name }}
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
  </v-container>
</template>

<script>

import SourceComponent from './_source.vue';
import ConditionComponent from './_condition.vue';
import TargetComponent from './_target.vue';

export default {
  name: 'PipelineReportView',

  components: {
    SourceComponent,
    ConditionComponent,
    TargetComponent,
  },

  data: () => ({
    isLoading: true,
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
      for (const condition in this.pipeline.Pipeline.Sources) {
        return true
      }
      return false;
    },

    isTargets(){
      for (const condition in this.pipeline.Pipeline.Targets) {
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
      switch (input) {
        case "✔":
          return "success"
        case "✗":
          return "red"
        case "⚠":
          return "orange"
        case "-":
          return "grey"
        default:
          return "yellow"
      }
    },

    getStatusIcon: function(status){
      switch (status) {
        case "✔":
          return "mdi-robot-love"
        case "✗":
          return "mdi-robot-angry"
        case "⚠":
          return "mdi-robot-confused"
        default:
          return "mdi-robot-off"
      }
    },

    async getPipelineReportData() {
      const isAuthEnabled = process.env.VUE_APP_AUTH_ENABLED === 'true';
      if (isAuthEnabled) {
        const token = await this.$auth0.getAccessTokenSilently();
        const response = await fetch('/api/pipeline/reports/' + this.$route.params.id, {
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
        const response = await fetch('/api/pipeline/reports/' + this.$route.params.id);
        const data = await response.json();

        this.pipeline = data.data;
        this.isLoading = false;

        if (this.pipeline !== null) {
          this.latestReportByID = data.latestReportByID
          this.isLatestReport()
        }
      }
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
