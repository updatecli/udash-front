<template>
  <v-app>
    <HeadNavigation/>
    <SideNavigation/>

    <v-main>
      <!-- Hero Section -->
      <v-container class="hero-section py-16">
        <v-row align="center" justify="center">
          <v-col cols="12" lg="8" md="10" class="text-center">
            <h1 class="display-2 font-weight-bold mb-4">
              Udash <v-icon size="large" icon="mdi-home-city" color="grey-darken-3"></v-icon>
            </h1>
            <p class="text-h6 mb-8 text-medium-emphasis">
              An innovative monitoring platform for your project's dependencies
            </p>
            <div class="d-flex flex-wrap justify-center gap-4 mb-8">
              <v-btn
                v-for="link in primaryLinks"
                :key="link.name"
                :to="link.to"
                :prepend-icon="link.icon"
                color="grey-darken-3"
                variant="elevated"
                size="large"
                class="mx-2"
              >
                {{ link.name }}
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-container>

      <!-- Features Section -->
      <v-container class="py-12">
        <v-row>
          <v-col cols="12" class="text-center mb-8">
            <h2 class="text-h4 font-weight-bold mb-4">What Udash Can Do</h2>
            <p class="text-h6 text-medium-emphasis">
              Get visibility into dependency updates with three key capabilities
            </p>
          </v-col>
        </v-row>
        
        <v-row>
          <v-col
            v-for="feature in features"
            :key="feature.title"
            cols="12"
            md="4"
            class="mb-6"
          >
            <v-card height="100%" flat class="pa-4 text-center">
              <v-icon
                :icon="feature.icon"
                size="48"
                color="grey-darken-3"
                class="mb-4"
              ></v-icon>
              <v-card-title class="text-h6 mb-2">{{ feature.title }}</v-card-title>
              <v-card-text>{{ feature.description }}</v-card-text>
            </v-card>
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
                    <h3 class="text-h5 mb-4">Ready to start monitoring?</h3>
                    <p class="mb-6">
                      Connect your Updatecli instance to Udash in just a few steps
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
                        <p class="mb-3">{{ step.description }}</p>
                        <pre>
                          <v-code class="d-block pa-3 bg-grey-lighten-4">
                            {{ step.code }}
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
    
    primaryLinks: [
      {
        name: "Dashboard",
        to: "/scm/dashboard",
        icon: "mdi-satellite-variant",
      },
      {
        name: "Reports",
        to: "/pipeline/reports",
        icon: "mdi-book-open-variant",
      },
      {
        name: "Configs",
        to: "/pipeline/configs",
        icon: "mdi-transit-connection-variant",
      },
    ],
    
    features: [
      {
        title: "Dashboard",
        icon: "mdi-satellite-variant",
        description: "Visualize update status by Git repository with clear visual overviews."
      },
      {
        title: "Reports",
        icon: "mdi-book-open-variant",
        description: "Search pipelines by Git repository and branch for audit or debugging purposes."
      },
      {
        title: "Configs",
        icon: "mdi-transit-connection-variant", 
        description: "Filter pipelines based on Updatecli manifests or policies used to trigger them."
      }
    ],
    
    configSteps: [
      {
        title: "Authenticate with Udash",
        description: "Configure Updatecli to send data to Udash",
        code: `updatecli udash login "${window.location.origin}" --experimental`
      },
      {
        title: "Login to GitHub Container Registry",
        description: `Allow Updatecli to pull the latest policies
        Updatecli relies on Docker credential to retrieve its policies from the GitHub Registry.`,
        code: "docker login ghcr.io"
      },
      {
        title: "Set GitHub Token",
        description: "Export your GitHub Personal Access Token",
        code: 'export GITHUB_TOKEN="your_github_personal_access_token"'
      },
      {
        title: "Create values.yaml",
        description: "Configure your repository details",
        code: `
scm:
  enabled: true
  kind: github
  owner: "your-github-username"
  repository: "your-repository-name"
  branch: main`
      },
      {
        title: "Run Updatecli",
        description: "Execute with the autodiscovery policy",
        code: "updatecli diff --experimental --values ./values.yaml ghcr.io/updatecli/policies/policies/autodiscovery/all:latest"
      }
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
  })
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