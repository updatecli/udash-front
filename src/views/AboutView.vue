<template>
  <v-container class="page-container">

    <!-- Hero Section -->
    <section class="py-8 px-6">
      <h1 class="text-h1 font-weight-bold mb-4">About</h1>
      <p class="text-h6 text-medium-emphasis mb-0">
        What Udash is, who builds it
      </p>
    </section>

    <!-- Project Overview -->
    <section class="pt-0 pb-8 px-6">
      <v-card variant="flat" class="pa-4 pa-sm-6">
        <h2 class="text-h5 font-weight-bold d-flex align-center mb-4">
          <v-icon icon="mdi-rocket-launch" class="mr-2" aria-hidden="true"></v-icon>
          What is Udash?
        </h2>
        <p class="text-body-1 mb-0">
          Udash is a web dashboard designed to work with
          <a href="https://updatecli.io" target="_blank" rel="noopener noreferrer"
            class="text-decoration-none">Updatecli</a>,
          providing visibility into your dependency update workflows.
        </p>
      </v-card>
    </section>

    <!-- Community Links -->
    <section class="pt-0 pb-8 px-6">
      <v-card variant="flat" class="pa-4 pa-sm-6">
        <h2 class="text-h5 font-weight-bold d-flex align-center mb-4">
          <v-icon icon="mdi-heart" color="error" class="mr-2" aria-hidden="true"></v-icon>
          Join The Community
        </h2>
        <v-row>
          <v-col v-for="link in communityLinks" :key="link.name" cols="12" sm="6" md="3">
            <v-btn :href="link.url" target="_blank" rel="noopener noreferrer" variant="outlined"
              :prepend-icon="link.icon" block>
              {{ link.name }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card>
    </section>

    <!-- License Section -->
    <section class="pt-0 pb-8 px-6">
      <v-card variant="flat" class="pa-4 pa-sm-6">
        <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-4">
          <h2 class="text-h5 font-weight-bold d-flex align-center">
            <v-icon icon="mdi-scale-balance" class="mr-2" aria-hidden="true"></v-icon>
            License Information
          </h2>
          <v-chip color="success" variant="tonal">
            AGPL v3
          </v-chip>
        </div>

        <p class="text-body-1 mb-4">
          Udash is free and open-source software licensed under the
          <strong>GNU Affero General Public License v3.0</strong>.
        </p>

        <v-alert variant="tonal" class="mb-4">
          <p class="mb-2">
            <strong>What this means:</strong>
          </p>
          <ul class="license-terms">
            <li v-for="term in licenseTerms" :key="term.text" class="d-flex align-start mb-2">
              <v-icon :icon="term.icon" size="small" class="mr-2 mt-1" aria-hidden="true"></v-icon>
              <span class="text-body-2">{{ term.text }}</span>
            </li>
          </ul>
        </v-alert>

        <div class="d-flex ga-2 flex-wrap">
          <v-btn href="https://www.gnu.org/licenses/agpl-3.0.en.html" target="_blank" rel="noopener noreferrer"
            variant="outlined" prepend-icon="mdi-open-in-new" size="small">
            Read License Summary
          </v-btn>
          <v-btn href="https://github.com/updatecli/udash/blob/main/LICENSE" target="_blank"
            rel="noopener noreferrer" variant="outlined" prepend-icon="mdi-github" size="small">
            View on GitHub
          </v-btn>
        </div>
      </v-card>
    </section>

  </v-container>
</template>

<script>
export default {
  name: 'AboutView',

  data: () => ({
    communityLinks: [
      {
        name: 'GitHub',
        icon: 'mdi-github',
        url: 'https://github.com/updatecli/updatecli'
      },
      {
        name: 'Chat',
        icon: 'mdi-chat',
        url: 'https://matrix.to/#/#Updatecli_community:gitter.im'
      },
      {
        name: 'Documentation',
        icon: 'mdi-book-open-variant',
        url: 'https://updatecli.io/'
      },
      {
        name: 'Issues',
        icon: 'mdi-bug',
        url: 'https://github.com/updatecli/updatecli/issues'
      }
    ],

    // The full licence text is not inlined here: it already lives in the repository's
    // LICENSE file, and the two buttons below point at an authoritative copy. Keeping a
    // second copy in the bundle only invited drift between them.
    licenseTerms: [
      {
        icon: 'mdi-arrow-right-circle',
        text: 'You can use, modify, and distribute this software freely'
      },
      {
        icon: 'mdi-arrow-right-circle',
        text: 'You can use it for commercial purposes'
      },
      {
        icon: 'mdi-arrow-right-circle',
        text: 'If you modify and run it on a server, you must make the source code available'
      },
      {
        icon: 'mdi-arrow-right-circle',
        text: 'Any derivative works must also be licensed under AGPL v3'
      }
    ],
  }),
}
</script>

<style scoped>
/* Matches HomeView so both pages share the same left/right content edge. */
.page-container {
  max-width: 1100px;
}

/* Kept as a list for screen readers, but the icons carry the marker, so the
   default bullets and their indent are dropped. */
.license-terms {
  list-style: none;
  padding-left: 0;
}
</style>
