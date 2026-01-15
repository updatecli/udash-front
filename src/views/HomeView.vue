<template>
  <v-app>
    <HeadNavigation/>
    <SideNavigation/>

    <v-main>
      <!-- Hero Section -->
      <v-container class="hero-section">
        <v-row align="center" justify="center">
          <v-col cols="12" lg="8" md="10" class="text-center">
            <h1 class="display-2 font-weight-bold mb-4">
              Udash <v-icon size="large" icon="mdi-home-city" color="grey-darken-3"></v-icon>
            </h1>
            <p class="text-h6 mb-8 text-medium-emphasis">
              An innovative monitoring platform for your project's dependencies
            </p>
          </v-col>
        </v-row>
      </v-container>

      <!-- Features Section -->
      <v-container class="py-12">
        <v-row>
          <v-col
            v-for="feature in features"
            :key="feature.title"
            cols="12"
            md="4"
            class="mb-6"
          >
            <router-link :to="feature.to" style="text-decoration: none; color: inherit;">
              <v-card height="100%" flat class="pa-4 text-center" hover>
                <v-icon
                  :icon="feature.icon"
                  size="48"
                  color="grey-darken-3"
                  class="mb-4"
                ></v-icon>
                <v-card-title class="text-h6 mb-2">{{ feature.title }}</v-card-title>
                <v-card-text>{{ feature.description }}</v-card-text>
              </v-card>
            </router-link>
          </v-col>
        </v-row>
      </v-container>

      <!-- Quick Start Section -->
      <v-container class="py-12 bg-grey-lighten-5">
        <v-row justify="center">
          <v-col cols="12" lg="8" md="10">
            <v-card flat class="pa-6">
              <v-card-title class="text-h4 text-center mb-6">Get Started</v-card-title>
              
              <!-- Tabs for different sections -->
              <v-tabs v-model="activeTab" centered>
                <v-tab value="quickstart">Quick Start</v-tab>
                <v-tab value="configure">Configure</v-tab>
                <v-tab value="contribute">Contribute</v-tab>
              </v-tabs>

              <v-window v-model="activeTab" class="mt-6">
                <!-- Quick Start Tab -->
                <v-window-item value="quickstart">
                  <div class="text-center py-8">
                    <v-icon icon="mdi-rocket-launch" size="64" color="grey-darken-3" class="mb-4"></v-icon>
                    <h3 class="text-h5 mb-4">Ready to start?</h3>
                    <p class="mb-6">
                      Connect your Updatecli runner to Udash in just a few steps
                    </p>
                    <v-btn
                      color="grey-darken-3"
                      size="large"
                      @click="activeTab = 'configure'"
                      append-icon="mdi-arrow-right"
                    >
                      View Setup Guide
                    </v-btn>
                  </div>
                </v-window-item>

                <!-- Configure Tab -->
                <v-window-item value="configure">
                  <v-expansion-panels variant="accordion">
                    <v-expansion-panel
                      v-for="(step, index) in configSteps"
                      :key="index"
                      :title="`${index + 1}. ${step.title}`"
                    >
                      <v-expansion-panel-text>
                        <div class="mb-3" v-html="step.description"></div>
                        <pre class="mb-3 overflow-x-auto">
                          <v-code v-if="step.code" class="bg-grey-lighten-4">
{{ getStepCode(step) }}
                          </v-code>
                        </pre>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-window-item>

                <!-- Contribute Tab -->
                <v-window-item value="contribute">
                  <div class="text-center py-4">
                    <v-icon icon="mdi-heart" size="48" color="red" class="mb-4"></v-icon>
                    <h3 class="text-h5 mb-4">Join Our Community</h3>
                    <p class="mb-6">
                      Help shape the future of dependency monitoring
                    </p>
                    <v-row>
                      <v-col
                        v-for="contribute in contributeWays"
                        :key="contribute.title"
                        cols="12"
                        sm="6"
                        md="4"
                      >
                        <v-btn
                          :href="contribute.link"
                          target="_blank"
                          variant="outlined"
                          :prepend-icon="contribute.icon"
                          block
                          class="mb-2"
                        >
                          {{ contribute.title }}
                        </v-btn>
                      </v-col>
                    </v-row>
                  </div>
                </v-window-item>
              </v-window>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
    
    <ReleaseFooter/>
  </v-app>
</template>

<script>
import ReleaseFooter from '../components/ReleaseFooter.vue';
import SideNavigation from '../components/SideNavigation.vue';
import HeadNavigation from '../components/HeadNavigation.vue';

export default {
  name: 'HomeView',
  components: {
    ReleaseFooter,
    SideNavigation,
    HeadNavigation,
  },
  data: () => ({
    activeTab: 'quickstart',
    host: window.location.origin,
    
    features: [
      {
        title: "Dashboard",
        icon: "mdi-view-dashboard",
        description: "Visualize update status by Git repository with clear visual overviews.",
        to: "/scm/dashboard"
      },
      {
        title: "Reports",
        icon: "mdi-book-open-variant",
        description: "Search pipelines by Git repository and branch for audit or debugging purposes.",
        to: "/pipeline/reports"
      },
      {
        title: "Configs",
        icon: "mdi-transit-connection-variant", 
        description: "Filter pipelines based on Updatecli manifests or policies used to trigger them.",
        to: "/pipeline/configs"
      }
    ],
    
    configSteps: [
      {
        title: "Install Updatecli",
        description: "Make sure Updatecli is installed.<br/><a href=\"https://www.updatecli.io/docs/prologue/installation/\" target=\"_blank\" rel=\"noopener noreferrer\">View installation options</a>",
        code: `brew tap updatecli/updatecli\nbrew install updatecli`
      },
      {
        title: "Choose authentication method",
        description: `
          <ul>
            <li>Method A (Config file): Stores token locally, secure for local development</li>
            <li>Method B (Environment variables): Better for CI/CD pipelines and containers</li>
          </ul>
        `
      },
      {
        title: "Authenticate (Method A - Config File)",
        description: "Configure Updatecli to use a local config file to connect to Udash",
        codeTemplate: true,
        code: (apiUrl, dashUrl) => `updatecli udash login --experimental --api-url "${apiUrl}" "${dashUrl}"`
      },
      {
        title: "Authenticate (Method B - Environment Variables)",
        description: "Set environment variables for Updatecli to connect to Udash",
        codeTemplate: true,
        code: (apiUrl, dashUrl) => `export UPDATECLI_UDASH_API_URL="${apiUrl}"\nexport UPDATECLI_UDASH_URL="${dashUrl}"\nexport UPDATECLI_UDASH_ACCESS_TOKEN="your_token_here"  # Only if required by your Udash instance`
      },
      {
        title: "Run Updatecli",
        description: "Execute Updatecli with the --experimental flag to send reports to Udash",
        code: `updatecli diff --experimental`
      },
    ],
    
    contributeWays: [
      {
        title: "Star on GitHub",
        icon: "mdi-star",
        link: "https://github.com/updatecli/udash"
      },
      {
        title: "Report Issues",
        icon: "mdi-bug",
        link: "https://github.com/updatecli/udash/issues"
      },
      {
        title: "Contribute Code",
        icon: "mdi-code-tags",
        link: "https://github.com/updatecli/udash/blob/main/CONTRIBUTING.md"
      }
    ]
  }),
  computed: {
    apiBaseUrl() {
      return window.config?.API_BASE_URL || window.location.origin + "/api"
    },
    dashboardUrl() {
      return window.location.origin
    }
  },
  methods: {
    getStepCode(step) {
      if (step.codeTemplate && typeof step.code === 'function') {
        return step.code(this.apiBaseUrl, this.dashboardUrl)
      }
      return step.code || ''
    }
  }
}
</script>

<style scoped>
.hero-section {
  background: linear-gradient(135deg, rgba(var(--v-theme-grey-darken-3), 0.1) 0%, rgba(var(--v-theme-secondary), 0.1) 100%);
}

.gap-4 {
  gap: 1rem;
}
</style>
