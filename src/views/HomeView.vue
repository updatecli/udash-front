<template>
  <v-app>
    <HeadNavigation/>
    <SideNavigation/>

    <v-main>
      <v-container>
        <v-row>
          <v-col
            class="text-right"
            cols="auto"
            lg="8"
            md="8"
            sm="12"
          >
          <h1>Udash <v-icon icon="mdi-home-city"></v-icon></h1>
          </v-col>
        </v-row>

        <v-row>
          <v-col
            class="text-right"
            cols="auto"
            lg="8"
            md="8"
            sm="12"
          >
            <p>
            Udash is an innovative monitoring platform designed to provide<br/>
            flexibility and insight into your project's dependencies.<br/>
            Powered by Updatecli, Udash enables a declarative approach to dependency monitoring.<br/>
            By integrating Updatecli’s capabilities, Udash helps streamline dependency updates,<br/>
            improve security by identifying outdated versions,
            and maintain consistency across your projects, all in a flexible, declarative framework.
            </p>
          </v-col>
          <v-col
            cols="auto"
            lg="4"
            md="4"
            sm="12"
            >
            <div
              v-for="link in links"
              :key="link.name"
              >
              <v-btn
                class="mx-4"
                variant="text"
                :prepend-icon="link.icon"
                :to="link.to">
                {{ link.name }}
              </v-btn>
            </div>
          </v-col>
        </v-row>

        <v-row
        >
          <v-col
            cols="12"
            lg="5"
            offset-lg="3"
            md="12"
            sm="12"
          >
            <v-card
              flat
              class="mb-6 mt-6"
            >
              <v-card-title
                class="text-right"
              >What Udash Can Do</v-card-title>

                <v-card-text class="text-body-1">
                <v-divider thickness="5" class="mb-4 mt-4"></v-divider>
                <p>
                  <strong>Udash</strong> gives you visibility into dependency updates by organizing and surfacing
                  <code>Updatecli</code> execution data in three key ways:
                </p>

                <v-list class="mt-4" lines="two" density="comfortable">
                  <v-list-item>
                    <template #prepend>
                      <v-icon color="primary">mdi-book-open-variant</v-icon>
                    </template>
                    <v-list-item-title>Reports: Search by Git Repository and Branch</v-list-item-title>
                    <v-list-item-subtitle>
                      Quickly find pipelines associated with specific repositories and branches for audit or debugging purposes.
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <template #prepend>
                      <v-icon color="primary">mdi-transit-connection-variant</v-icon>
                    </template>
                    <v-list-item-title>Configs: Search by Updatecli Configuration</v-list-item-title>
                    <v-list-item-subtitle>
                      Filter pipelines based on the Updatecli manifest or policy used to trigger them.
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <template #prepend>
                      <v-icon color="primary">mdi-satellite-variant</v-icon>
                    </template>
                    <v-list-item-title>Dashboard: Visualize Update Status by Git Repository</v-list-item-title>
                    <v-list-item-subtitle>
                      View which repositories are up-to-date or require attention with a clear visual overview.
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>

                <p class="mt-6">
                  These capabilities help teams stay ahead of dependency drift, automate update workflows,
                  and maintain consistency across codebases.
                </p>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col
            cols="12"
            lg="5"
            offset-lg="3"
            md="12"
            sm="12"
          >
            <v-card
              flat
              class="mb-6 mt-6"
            >
              <v-card-title
                class="text-right"
              >Configure Updatecli for Udash</v-card-title>

              <v-card-text class="text-body-1">
                <v-divider thickness="5" class="mb-4 mt-4"></v-divider>
                <p>
                  Udash relies on your local <strong>Updatecli</strong> to collect and report dependency information.
                  To start sending data to Udash, follow the steps below:
                </p>

                <!--
                <v-alert type="warning" class="my-4" border="start" colored-border>
                  <strong>Note:</strong> Authentication is currently in alpha and not required for now.
                </v-alert>
                -->

                <v-list class="mb-6">
                  <v-list-item class="mb-2">
                    <template #prepend>
                      <v-icon color="primary">mdi-numeric-1</v-icon>
                    </template>
                    Authenticate your Updatecli client with Udash to configure Updatecli to send data to Udash.
                    <v-code class="mt-1 d-block pa-2 bg-grey-lighten-4 rounded" style="white-space: pre; overflow-x: auto;">
                      updatecli udash login "{{ host }}" --experimental
                    </v-code>
                  </v-list-item>
                  <v-divider></v-divider>
                  <v-list-item class="mb-2">
                    <template #prepend>
                      <v-icon color="primary">mdi-numeric-2</v-icon>
                    </template>
                    Authenticate with ghcr.io(GitHub Container Registry) to allow Updatecli to pull the latest Updatecli policy from the GitHub Container Registry.
                    <v-code class="mt-1 d-block pa-2 bg-grey-lighten-4 rounded" style="white-space: pre; overflow-x: auto;">
                      docker login ghcr.io
                    </v-code>
                  </v-list-item>
                  <v-divider></v-divider>
                  <v-list-item class="mb-2">
                    <template #prepend>
                      <v-icon color="primary">mdi-numeric-3</v-icon>
                    </template>
                    Export your GitHub Personal Access Token (PAT) as an environment variable to allow Updatecli to access your GitHub repository.
                    <v-code class="mt-1 d-block pa-2 bg-grey-lighten-4 rounded" style="white-space: pre; overflow-x: auto;">
                      export GITHUB_TOKEN="your_github_personal_access_token"
                    </v-code>
                  </v-list-item>
                  <v-divider></v-divider>
                  <v-list-item class="mb-2">
                    <template #prepend>
                      <v-icon color="primary">mdi-numeric-4</v-icon>
                    </template>
                    Customize your values.yaml file to tell Updatecli which GitHub repository to monitor.
                    <v-card flat>
                        <v-card-title class="d-flex justify-space-between align-center">
                        </v-card-title>
                        <v-card-text>
                          <pre
                            class="rounded bg-grey-lighten-4 pa-4"
                            style="overflow-x: auto; white-space: pre-wrap;"
                          >
<code>
scm:
  enabled: true
  kind: github
  owner: "insert your GitHub repository owner"
  repository: "insert your GitHub repository name"
  branch: main
  # url: "insert your GitHub repository URL"
</code>
                          </pre>
                        </v-card-text>
                      </v-card>
                  </v-list-item>
                  <v-divider></v-divider>
                  <v-list-item class="mb-2">
                    <template #prepend>
                      <v-icon color="primary">mdi-numeric-5</v-icon>
                    </template>
                    Finally run Updatecli with the autodiscovery policy:
                    <v-code class="mt-1 d-block pa-2 bg-grey-lighten-4 rounded" style="white-space: pre; overflow-x: auto;">
                      updatecli diff --experimental --values ./values.yaml ghcr.io/updatecli/policies/policies/autodiscovery/all:latest
                    </v-code>
                  </v-list-item>
                </v-list>

                <p>
                  After this setup, every time you run <code>updatecli</code>, a pipeline execution report will be automatically published to Udash.<br/>
                  This enables dashboards and insights without manual data entry.<br/>

                  More documentation is available on <a href="https://www.updatecli.io/docs/prologue/quick-start/">updatecli.io</a> to better understand how to leverage Updatecli with Udash.
                </p>

              </v-card-text>
            </v-card>
          </v-col>
          <v-col
            cols="12"
            lg="5"
            offset-lg="3"
            md="12"
            sm="12"
          >
            <v-card
              flat
              class="mb-6 mt-6"
            >
              <v-card-title
                class="text-right"
              >Going Further</v-card-title>

              <v-card-text class="text-body-1">
                <v-divider thickness="5" class="mb-4 mt-4"></v-divider>
                <p>
                  This project is just getting started — and we’d love your help shaping its future!
                </p>

                <p>
                  As a community-oriented initiative, <strong>all contributions are welcome and appreciated</strong>.
                  Whether you're a developer, user, or advocate, here are a few great ways to get involved:
                </p>

                <v-list class="mb-4" density="comfortable" lines="one">
                  <v-list-item>
                    <template #prepend>
                      <v-icon color="primary">mdi-star-outline</v-icon>
                    </template>
                    <v-list-item-title>
                      Star the repositories:
                      <a href="https://github.com/updatecli/updatecli" target="_blank">updatecli</a>,
                      <a href="https://github.com/updatecli/udash" target="_blank">udash</a>,
                      and
                      <a href="https://github.com/updatecli/udash-front" target="_blank">udash-front</a>
                    </v-list-item-title>
                  </v-list-item>

                  <v-list-item>
                    <template #prepend>
                      <v-icon color="primary">mdi-lightbulb-outline</v-icon>
                    </template>
                    <v-list-item-title>
                      Propose a new feature by opening an issue
                    </v-list-item-title>
                  </v-list-item>

                  <v-list-item>
                    <template #prepend>
                      <v-icon color="primary">mdi-thumb-up-outline</v-icon>
                    </template>
                    <v-list-item-title>
                      Upvote existing feature requests to show your support
                    </v-list-item-title>
                  </v-list-item>

                  <v-list-item>
                    <template #prepend>
                      <v-icon color="primary">mdi-code-tags</v-icon>
                    </template>
                    <v-list-item-title>
                      Contribute code or docs to any
                      <a href="https://github.com/updatecli" target="_blank">Updatecli repository</a>
                    </v-list-item-title>
                  </v-list-item>

                  <v-list-item>
                    <template #prepend>
                      <v-icon color="primary">mdi-heart-outline</v-icon>
                    </template>
                    <v-list-item-title>
                      Spread the word and share the project!
                    </v-list-item-title>
                  </v-list-item>
                </v-list>

                <p>
                  For more details on contributing, please read our
                  <a href="https://github.com/updatecli/udash/blob/main/CONTRIBUTING.md" target="_blank">CONTRIBUTING guide</a>.
                </p>
              </v-card-text>

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
    isLoading: true,
    links:[
      {
        name: "Dashboard",
        to: "/scm/dashboard",
        icon: "mdi-arrow-right-circle",
      },
      {
        name: "Reports",
        to: "/pipeline/reports",
        icon: "mdi-arrow-right-circle",
      },
      {
        name: "Configs",
        to: "/pipeline/configs",
        icon: "mdi-arrow-right-circle",
      },
  ]
  }),
}
</script>
