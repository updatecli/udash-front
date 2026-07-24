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

        <!-- Get Started Section -->
        <section class="py-8">
          <v-card flat color="background" class="pa-6">
            <v-card-title class="text-h4 font-weight-bold px-0 mb-2">Get Started</v-card-title>
            <p class="text-medium-emphasis mb-8">
              Connect your Updatecli runner to Udash in a few steps
            </p>

            <div v-for="(step, index) in configSteps" :key="index" class="mb-8">
              <h3 class="text-h6 mb-2">{{ index + 1 }}. {{ step.title }}</h3>
              <div class="mb-3" v-html="step.description"></div>

              <!-- Step with mutually-exclusive methods (Authenticate) -->
              <template v-if="step.methods">
                <v-tabs v-model="authMethod" density="comfortable" class="mb-4">
                  <v-tab
                    v-for="(method, mIndex) in step.methods"
                    :key="mIndex"
                    :value="mIndex"
                  >
                    {{ method.label }}
                  </v-tab>
                </v-tabs>
                <v-window v-model="authMethod">
                  <v-window-item
                    v-for="(method, mIndex) in step.methods"
                    :key="mIndex"
                    :value="mIndex"
                  >
                    <p class="mb-3 text-medium-emphasis">{{ method.description }}</p>
                    <div class="code-block mb-3">
                      <v-btn
                        class="copy-btn"
                        :icon="copiedKey === `auth-${mIndex}` ? 'mdi-check' : 'mdi-content-copy'"
                        size="small"
                        variant="text"
                        :aria-label="`Copy ${method.label} command`"
                        @click="copyCode(methodCode(method), `auth-${mIndex}`)"
                      ></v-btn>
                      <pre class="overflow-x-auto"><code v-highlight class="language-bash">{{ methodCode(method) }}</code></pre>
                    </div>
                  </v-window-item>
                </v-window>
              </template>

              <!-- Single-command step -->
              <div v-else-if="step.code" class="code-block mb-3">
                <v-btn
                  class="copy-btn"
                  :icon="copiedKey === `step-${index}` ? 'mdi-check' : 'mdi-content-copy'"
                  size="small"
                  variant="text"
                  :aria-label="`Copy ${step.title} command`"
                  @click="copyCode(getStepCode(step), `step-${index}`)"
                ></v-btn>
                <pre class="overflow-x-auto"><code v-highlight class="language-bash">{{ getStepCode(step) }}</code></pre>
              </div>
            </div>
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

      </v-container>
    </v-main>

    <ReleaseFooter/>
  </v-app>
</template>

<script>
import ReleaseFooter from '../components/ReleaseFooter.vue';
import SideNavigation from '../components/SideNavigation.vue';
import HeadNavigation from '../components/HeadNavigation.vue';
import { getDashboardUrl } from '@/composables/runtime';
import { getApiBaseUrl } from '@/composables/api';

export default {
  name: 'HomeView',
  components: {
    ReleaseFooter,
    SideNavigation,
    HeadNavigation,
  },
  data: () => ({
    authMethod: 0,
    copiedKey: null,

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

    configSteps: [
      {
        title: "Install Updatecli",
        description: "The snippet below uses Homebrew (macOS). <a class=\"text-info\" href=\"https://www.updatecli.io/docs/prologue/installation/\" target=\"_blank\" rel=\"noopener noreferrer\">See all install options</a> for Linux, Windows, and binaries.",
        code: `brew tap updatecli/updatecli\nbrew install updatecli`
      },
      {
        title: "Authenticate",
        description: "Connect Updatecli to Udash. Pick the method that fits your environment — you only need one.",
        methods: [
          {
            label: "Method A – Config file",
            description: "Stores the token locally — convenient and secure for local development.",
            code: (apiUrl, dashUrl) => `updatecli udash login --experimental --api-url "${apiUrl}" "${dashUrl}"`
          },
          {
            label: "Method B – Environment variables",
            description: "Better for CI/CD pipelines and containers.",
            code: (apiUrl, dashUrl) => `export UPDATECLI_UDASH_API_URL="${apiUrl}"\nexport UPDATECLI_UDASH_URL="${dashUrl}"\nexport UPDATECLI_UDASH_ACCESS_TOKEN="your_token_here"  # Only if required by your Udash instance`
          }
        ]
      },
      {
        title: "Run Updatecli",
        description: "Execute Updatecli with the --experimental flag to send reports to Udash.",
        code: `updatecli diff --experimental`
      },
    ]
  }),
  computed: {
    apiBaseUrl() {
      return getApiBaseUrl()
    },
    dashboardUrl() {
      return getDashboardUrl()
    }
  },
  methods: {
    getStepCode(step) {
      if (step.codeTemplate && typeof step.code === 'function') {
        return step.code(this.apiBaseUrl, this.dashboardUrl)
      }
      return step.code || ''
    },
    methodCode(method) {
      if (typeof method.code === 'function') {
        return method.code(this.apiBaseUrl, this.dashboardUrl)
      }
      return method.code || ''
    },
    copyCode(text, key) {
      if (!navigator.clipboard) {
        return
      }
      navigator.clipboard.writeText(text).then(() => {
        this.copiedKey = key
        setTimeout(() => {
          if (this.copiedKey === key) {
            this.copiedKey = null
          }
        }, 1500)
      })
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

/* Position the copy button in the top-right corner of each code block. */
.code-block {
  position: relative;
  min-width: 0;
}

/* Guarantee long commands scroll inside the block instead of widening the
   page on a narrow viewport (pairs with the pre's overflow-x-auto). */
.code-block pre {
  max-width: 100%;
}

.copy-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 1;
}
</style>
