<template>
  <v-container
    v-if="reportsData"
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
        v-if="!isLoading"
      >
        <h1>
          Config <v-icon icon="mdi-transit-connection-horizontal"></v-icon>
        </h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        v-if="configData.Config"
      >
      <h2>{{ configData.Config.Name }}</h2>
      <p>
        Kind: {{  configData.Config.Kind }}
      </p>
      <p>
        Type: {{ configType }}
      </p>

      <v-spacer class="py-4"></v-spacer>
      <v-divider></v-divider>
      <pre><code v-highlight class="language-yaml">{{  toYAML(configData.Config.Spec) }}</code></pre>
      <v-divider></v-divider>
      <v-spacer class="py-4"></v-spacer>

      <div
        v-if="isTargetConfig()"
      >
        <!--
        Still a working progress, not implemented yet.
        Feel free to come with ideas on what you would like to see here.
        -->
      </div>

      <div
        v-if="isSourceConfig()"
      >
        <h2>Linked report:</h2>
        <v-card
          variant="flat"
          class="pl-4"
          v-for="(scmData, scmURL) in gitReportsData"
          :key="scmURL">
          <v-card-title
            v-if="isValidGitURLInfo(extractGitURLInfo(scmURL))"
          >
            <div
              v-if="extractGitURLInfo(scmURL).provider === 'github'"
            >
              <v-icon icon="mdi-github"></v-icon>
              {{ extractGitURLInfo(scmURL).owner }}/{{ extractGitURLInfo(scmURL).repo }}
            </div>
            <div
              v-else-if="extractGitURLInfo(scmURL).provider === 'gitlab'"
            >
              <v-icon icon="mdi-gitlab"></v-icon>
              {{ extractGitURLInfo(scmURL).owner }}/{{ extractGitURLInfo(scmURL).repo }}
            </div>
            <div
              v-else
            >
              <v-icon icon="mdi-git"></v-icon>
              {{ extractGitURLInfo(scmURL).provider }}/{{ extractGitURLInfo(scmURL).owner }}/{{ extractGitURLInfo(scmURL).repo }}
            </div>


          </v-card-title>
          <v-card-title
            v-else
          >
            <v-icon icon="mdi-git"></v-icon>{{ scmURL }}
          </v-card-title>
          <v-card-text
          >
            <v-card
              variant="flat"
              class="pl-4"
              v-for="(branchData, branchName) in scmData"
              :key="branchName">
              <v-card-title><v-icon icon="mdi-source-branch"></v-icon>{{ branchName }}</v-card-title>
              <v-card-text>
                <v-card
                  class="pl-4"
                  v-for="report in branchData"
                  :key="report.ID"
                  variant="outlined"
                >
                  <v-card-title>
                    <v-icon icon="mdi-file-document-outline"></v-icon>
                    {{ report.Name }}
                  </v-card-title>
                  <v-card-subtitle>
                    <span>Kind: {{ report.Kind }}</span>
                  </v-card-subtitle>
                  <v-card-text
                  >
                    {{  report.Description }}
                  </v-card-text>
                  <v-card-actions>
                    <v-btn
                      icon="mdi-eye"
                      :to="`/pipeline/reports/${report.ID}`"
                    >
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-card-text>
            </v-card>
          </v-card-text>
        </v-card>
        <div
          v-if="localReportsData.length !== 0"
        >
          <v-card
            variant="flat"
            class="pl-4"
          >
          <v-card-title
          >Local</v-card-title>

          </v-card>
          <v-card-text
            class="pl-4"
          >
            <v-card
              class="pl-4"
              v-for="report in localReportsData"
              :key="report.ID"
              variant="outlined"
            >
              <v-card-title>
                <v-icon icon="mdi-file-document-outline"></v-icon>
                {{ report.Name }}
              </v-card-title>
              <v-card-subtitle>
                <span>Kind: {{ report.Kind }}</span><br>
                <span>Type: {{ report.Type }}</span>
              </v-card-subtitle>
              <v-card-text
              >
                {{  report.Description }}
              </v-card-text>
              <v-card-actions>
                <v-btn
                  icon="mdi-eye"
                  :to="`/pipeline/reports/${report.ID}`"
                >
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-card-text>
        </div>
      </div>
      <div
        v-if="isConditionConfig()"
      >
        <h2>Linked report:</h2>
        <v-card
          variant="flat"
          class="pl-4"
          v-for="(scmData, scmURL) in gitReportsData"
          :key="scmURL">
          <v-card-title
            v-if="isValidGitURLInfo(extractGitURLInfo(scmURL))"
          >
            <div
              v-if="extractGitURLInfo(scmURL).provider === 'github'"
            >
              <v-icon icon="mdi-github"></v-icon>
              {{ extractGitURLInfo(scmURL).owner }}/{{ extractGitURLInfo(scmURL).repo }}
            </div>
            <div
              v-else-if="extractGitURLInfo(scmURL).provider === 'gitlab'"
            >
              <v-icon icon="mdi-gitlab"></v-icon>
              {{ extractGitURLInfo(scmURL).owner }}/{{ extractGitURLInfo(scmURL).repo }}
            </div>
            <div
              v-else
            >
              <v-icon icon="mdi-git"></v-icon>
              {{ extractGitURLInfo(scmURL).provider }}/{{ extractGitURLInfo(scmURL).owner }}/{{ extractGitURLInfo(scmURL).repo }}
            </div>

          </v-card-title>
          <v-card-title
            v-else
          >
            <v-icon icon="mdi-git"></v-icon>{{ scmURL }}
          </v-card-title>
          <v-card-text
          >
            <v-card
              variant="flat"
              class="pl-4"
              v-for="(branchData, branchName) in scmData"
              :key="branchName">
              <v-card-title><v-icon icon="mdi-source-branch"></v-icon>{{ branchName }}</v-card-title>
              <v-card-text>
                <v-card
                  class="pl-4"
                  v-for="report in branchData"
                  :key="report.ID"
                  variant="outlined"
                >
                  <v-card-title>
                    <v-icon icon="mdi-file-document-outline"></v-icon>
                    {{ report.Name }}
                  </v-card-title>
                  <v-card-subtitle>
                    <span>Kind: {{ report.Kind }}</span>
                    <span>Type: {{ report.Type }}</span>
                  </v-card-subtitle>
                  <v-card-text
                  >
                    {{  report.Description }}
                  </v-card-text>
                  <v-card-actions>
                    <v-btn
                      icon="mdi-eye"
                      :to="`/pipeline/reports/${report.ID}`"
                    >
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-card-text>
            </v-card>
          </v-card-text>
        </v-card>
        <div
          v-if="localReportsData.length !== 0"
        >
          <v-card
            variant="flat"
            class="pl-4"
          >
          <v-card-title
          >Local</v-card-title>

          </v-card>
          <v-card-text
            class="pl-4"
          >
            <v-card
              class="pl-4"
              v-for="report in localReportsData"
              :key="report.ID"
              variant="outlined"
            >
              <v-card-title>
                <v-icon icon="mdi-file-document-outline"></v-icon>
                {{ report.Name }}
              </v-card-title>
              <v-card-subtitle>
                <span>Kind: {{ report.Kind }}</span><br>
                <span>Type: {{ report.Type }}</span>
              </v-card-subtitle>
              <v-card-text
              >
                {{  report.Description }}
              </v-card-text>
              <v-card-actions>
                <v-btn
                  icon="mdi-eye"
                  :to="`/pipeline/reports/${report.ID}`"
                >
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-card-text>
        </div>
      </div>
      <div
        v-if="isTargetConfig()"
      >
        <h2>Linked report:</h2>
        <v-card
          variant="flat"
          class="pl-4"
          v-for="(scmData, scmURL) in gitReportsData"
          :key="scmURL">
          <v-card-title
            v-if="isValidGitURLInfo(extractGitURLInfo(scmURL))"
          >
            <div
              v-if="extractGitURLInfo(scmURL).provider === 'github'"
            >
              <v-icon icon="mdi-github"></v-icon>
              {{ extractGitURLInfo(scmURL).owner }}/{{ extractGitURLInfo(scmURL).repo }}
            </div>
            <div
              v-else-if="extractGitURLInfo(scmURL).provider === 'gitlab'"
            >
              <v-icon icon="mdi-gitlab"></v-icon>
              {{ extractGitURLInfo(scmURL).owner }}/{{ extractGitURLInfo(scmURL).repo }}
            </div>
            <div
              v-else
            >
              <v-icon icon="mdi-git"></v-icon>
              {{ extractGitURLInfo(scmURL).provider }}/{{ extractGitURLInfo(scmURL).owner }}/{{ extractGitURLInfo(scmURL).repo }}
            </div>

          </v-card-title>
          <v-card-title
            v-else
          >
            <v-icon icon="mdi-git"></v-icon>{{ scmURL }}
          </v-card-title>
          <v-card-text
          >
            <v-card
              variant="flat"
              class="pl-4"
              v-for="(branchData, branchName) in scmData"
              :key="branchName">
              <v-card-title><v-icon icon="mdi-source-branch"></v-icon>{{ branchName }}</v-card-title>
              <v-card-text>
                <v-card
                  class="pl-4"
                  v-for="report in branchData"
                  :key="report.ID"
                  variant="outlined"
                >
                  <v-card-title>
                    <v-icon icon="mdi-file-document-outline"></v-icon>
                    {{ report.Name }}
                  </v-card-title>
                  <v-card-subtitle>
                    <span>Kind: {{ report.Kind }}</span>
                    <span>Type: {{ report.Type }}</span>
                  </v-card-subtitle>
                  <v-card-text
                  >
                    {{  report.Description }}
                  </v-card-text>
                  <v-card-actions>
                    <v-btn
                      icon="mdi-eye"
                      :to="`/pipeline/reports/${report.ID}`"
                    >
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-card-text>
            </v-card>
          </v-card-text>
        </v-card>
        <div
          v-if="localReportsData.length !== 0"
        >
          <v-card
            variant="flat"
            class="pl-4"
          >
          <v-card-title
          >Local</v-card-title>

          </v-card>
          <v-card-text
            class="pl-4"
          >
            <v-card
              class="pl-4"
              v-for="report in localReportsData"
              :key="report.ID"
              variant="outlined"
            >
              <v-card-title>
                <v-icon icon="mdi-file-document-outline"></v-icon>
                {{ report.Name }}
              </v-card-title>
              <v-card-subtitle>
                <span>Kind: {{ report.Kind }}</span><br>
                <span>Type: {{ report.Type }}</span>
              </v-card-subtitle>
              <v-card-text
              >
                {{  report.Description }}
              </v-card-text>
              <v-card-actions>
                <v-btn
                  icon="mdi-eye"
                  :to="`/pipeline/reports/${report.ID}`"
                >
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-card-text>
        </div>
      </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>

import { extractGitURLInfo } from '@/composables/git'
import { toYAML } from '@/composables/yaml'

import { UDASH_API_VERSION } from '@/constants';

export default {
  name: 'PipelineConfigView',

  data: () => ({
    isLoading: true,
    reportsData: {
      "data": {}
    },
    // gitReportsData is used to store reports data from Updatecli pipelines
    // that interact with Git repositories.
    gitReportsData: {},
    // localReportsData is used to store reports data from Updatecli pipelines
    // that do not interact with Git repositories.
    localReportsData: [],
    configData: {
      "data": {}
    },
    configID: "",
    configType: "",
  }),

  beforeUnmount() {
    this.cancelAutoUpdate();
  },

  methods: {

    extractGitURLInfo(url) {
      return extractGitURLInfo(url);
    },

    isValidGitURLInfo(info) {
      return info !== null && info.provider !== 'unknown';
    },

    parseTargetReport() {
      let results = {}

      this.reportsData.forEach((report) => {
        let targetID = ''
        if (report.FilteredResourceID !== undefined) {
          targetID = report.FilteredResourceID;
        }

        let targetData = report.Report.Targets[targetID];
        let id = targetID;

        report.FilteredResourceID = id;

        if (targetData.Scm.URL !== undefined &&
          targetData.Scm.URL !== "" &&
          targetData.Scm.Branch !== undefined &&
          targetData.Scm.Branch !== "") {

            const scmURL = targetData.Scm.URL;
            const scmBranch = targetData.Scm.Branch.Target;

            if (!(scmURL in results)) {
              results[scmURL] = {}
            }

            if (!(scmBranch in results[scmURL])) {
              results[scmURL][scmBranch] = {}
            }

            if (!(id in results[scmURL][scmBranch])) {
              results[scmURL][scmBranch] = []
            }

            results[targetData.Scm.URL][targetData.Scm.Branch.Target].push({
              "ID": report.ID,
              "TargetID": id,
              "Result": targetData.Result,
              "Description": targetData.Description,
              "Kind": targetData.Config.Kind,
              "Name": targetData.Config.Name,
              "Type": "target",
            })

        } else {
          console.warn("Skipping target with no SCM URL or Branch: ", targetData);
          this.localReportsData.push({
            "ID": report.ID,
            "ConditionID": id,
            "Result": targetData.Result,
            "Description": targetData.Description,
            "Kind": targetData.Config.Kind,
            "Name": targetData.Config.Name,
            "Type": "target",
          });
        }

        this.gitReportsData = results;
      });
    },

    parseConditionReport() {
      let results = {}

      this.reportsData.forEach((report) => {
        let conditionID = ''
        if (report.FilteredResourceID !== undefined) {
          conditionID = report.FilteredResourceID;
        }

        let conditionData = report.Report.Conditions[conditionID];
        let id = conditionID;

        report.FilteredResourceID = id;

        if (conditionData.Scm.URL !== undefined &&
          conditionData.Scm.URL !== "" &&
          conditionData.Scm.Branch !== undefined &&
          conditionData.Scm.Branch !== "") {

            const scmURL = conditionData.Scm.URL;
            const scmBranch = conditionData.Scm.Branch.Target;

            if (!(scmURL in results)) {
              results[scmURL] = {}
            }

            if (!(scmBranch in results[scmURL])) {
              results[scmURL][scmBranch] = {}
            }

            if (!(id in results[scmURL][scmBranch])) {
              results[scmURL][scmBranch] = []
            }

            results[conditionData.Scm.URL][conditionData.Scm.Branch.Target].push({
              "ID": report.ID,
              "ConditionID": id,
              "Result": conditionData.Result,
              "Description": conditionData.Description,
              "Kind": conditionData.Config.Kind,
              "Name": conditionData.Config.Name,
              "Pass": conditionData.Pass,
              "Type": "condition",
            })

        } else {
          console.warn("Skipping target with no SCM URL or Branch: ", conditionData);
          this.localReportsData.push({
            "ID": report.ID,
            "ConditionID": id,
            "Result": conditionData.Result,
            "Description": conditionData.Description,
            "Kind": conditionData.Config.Kind,
            "Name": conditionData.Config.Name,
            "Pass": conditionData.Pass,
            "Type": "condition",
          });
        }

        this.gitReportsData = results;
      });
    },

    parseSourceReport() {
      let results = {}

      this.reportsData.forEach((report) => {
        let sourceID = ''
        if (report.FilteredResourceID !== undefined) {
          sourceID = report.FilteredResourceID;
        }

        for (const [id, targetData] of Object.entries(report.Report.Targets)) {
          if (targetData.SourceID !== sourceID) continue;

          report.FilteredResourceID = id;

          if (targetData.Scm.URL !== undefined &&
            targetData.Scm.URL !== "" &&
            targetData.Scm.Branch !== undefined &&
            targetData.Scm.Branch !== "") {

              const scmURL = targetData.Scm.URL;
              const scmBranch = targetData.Scm.Branch.Target;

              if (!(scmURL in results)) {
                results[scmURL] = {}
              }

              if (!(scmBranch in results[scmURL])) {
                results[scmURL][scmBranch] = {}
              }

              if (!(id in results[scmURL][scmBranch])) {
                results[scmURL][scmBranch] = []
              }

              results[targetData.Scm.URL][targetData.Scm.Branch.Target].push({
                "ID": report.ID,
                "TargetID": id,
                "Information": targetData.Information,
                "NewInformation": targetData.NewInformation,
                "Files": targetData.Files,
                "DryRun": targetData.DryRun,
                "Result": targetData.Result,
                "Description": targetData.Description,
                "Kind": targetData.Config.Kind,
                "Name": targetData.Config.Name,
                "Changelogs": targetData.Changelogs,
                "Type": "target"
              })

          } else {
            console.warn("Skipping target with no SCM URL or Branch: ", targetData);
            this.localReportsData.push({
              "ID": report.ID,
              "TargetID": id,
              "Information": targetData.Information,
              "NewInformation": targetData.NewInformation,
              "Files": targetData.Files,
              "DryRun": targetData.DryRun,
              "Result": targetData.Result,
              "Description": targetData.Description,
              "Kind": targetData.Config.Kind,
              "Name": targetData.Config.Name,
              "Changelogs": targetData.Changelogs,
              "Type": "target"
            });
          }
        }

        this.gitReportsData = results;


      });
    },

    toYAML(data) {
      return toYAML(data);
    },

    cancelAutoUpdate() {
      clearInterval(this.timer);
    },

    isSourceConfig() {
      return this.configType === 'source';
    },
    isConditionConfig() {
      return this.configType === 'condition';
    },
    isTargetConfig() {
      return this.configType === 'target';
    },

    async getConfigData() {
      this.$emit('loaded', false)
      let queryURL = `/api/${ UDASH_API_VERSION }/pipeline/config/${this.configType}s/search`

      const isAuthEnabled = process.env.VUE_APP_AUTH_ENABLED === 'true';

      let jsonReqBody = {
        id: this.configID,
      }

      if (isAuthEnabled){
        const token = await this.$auth0.getAccessTokenSilently();
        const response = await fetch(queryURL, {
            body: JSON.stringify(jsonReqBody),
            method: 'POST',
            headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();
        this.configData = data.configs[0]
      } else {
        const response = await fetch(queryURL,
          {
            body: JSON.stringify(jsonReqBody),
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        const data = await response.json();

        if (data.configs !== undefined && data.configs !== null) {
          this.configData = data.configs[0];
        } else {
          console.log("No configs found");
        }
      }
      this.$emit('loaded', true)
    },


    async getPipelineConfigReportsData() {
      const isAuthEnabled = process.env.VUE_APP_AUTH_ENABLED === 'true';
      const queryURL = `/api/${ UDASH_API_VERSION }/pipeline/reports/search`;

      if (this.configID === "") {
        console.error('Resource ID is not defined in the route parameters.');
        return;
      }

      //// Extract the third segment of the URL path
      //// This assumes the URL is structured like: /pipeline/configs/:resourceType/:id
      //// where :resourceType is the type of resource (e.g., source, condition, target)
      //const resourceType = this.$route.path.split('/')[3];

      let jsonReqBody = {};
      switch (this.configType) {
        case 'source':
          jsonReqBody.sourceid = this.configID;
          break
        case 'condition':
          jsonReqBody.conditionid = this.configID;
          break;
        case 'target':
          jsonReqBody.targetid = this.configID;
          break;
        case '':
          console.error('Missing resource type in the route parameters.');
          return;
        default:
          console.error('Unknown resource type:', this.configType);
          return;
      }

      if (isAuthEnabled) {
        const token = await this.$auth0.getAccessTokenSilently();
        const response = await fetch(queryURL, {
            method: 'POST',
            body: JSON.stringify(jsonReqBody),
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
          }
        });
        const data = await response.json();

        this.reportsData = data.data;
        this.isLoading = false;
      } else {
        const response = await fetch(queryURL,
          {
            method: 'POST',
            body: JSON.stringify(jsonReqBody),
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        const data = await response.json();

        this.reportsData = data.data;
        this.isLoading = false;
      }

      switch (this.configType) {
        case 'source':
          this.parseSourceReport();
          break;
        case 'condition':
          this.parseConditionReport();
          break;
        case 'target':
          this.parseTargetReport();
          break;
        default:
          console.error('Unknown config type:', this.configType);
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
    this.configID = this.$route.params.id;
      // Extract the third segment of the URL path
      // This assumes the URL is structured like: /pipeline/configs/:resourceType/:id
      // where :resourceType is the type of resource (e.g., source, condition, target)
    this.configType = this.$route.path.split('/')[3];

    this.$watch(
      () => this.$route.params,
      (toParams, previousParams) => {
        if (toParams.id != previousParams.id) {
          try {
            this.getPipelineConfigReportsData()
          } catch (error) {
            console.log(error);
          }

          try {
            this.getConfigData()
          } catch (error) {
            console.log(error);
          }
        }
      }
    )
    try {
      this.getConfigData()
    } catch (error) {
      console.log(error);
    }
    try {
      this.getPipelineConfigReportsData()
    } catch (error) {
      console.log(error);
    }
  },
}
</script>
