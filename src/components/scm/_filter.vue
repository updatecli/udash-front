<template>
  <v-container
      class="py-8 px-6"
      fluid
  >
    <v-form
      v-model="filterForm"
      @submit.prevent="applyFilter"
    >
      <!-- Repository Dropdown -->
       <v-select
        label="Git Repository"
        :items="repositories"
        :rules="[v => !!v || 'Git repository is required']"
        prepend-inner-icon="mdi-git"
        v-model="repository"
        ></v-select>

       <v-select
        label="Git Branch"
        :items="branches"
        :rules="[v => !!v || 'Git branch is required']"
        prepend-inner-icon="mdi-source-branch"
        v-model="branch"
        ></v-select>
      
        <!-- Filter repository-->
        <!--<v-btn type="submit" color="primary" :disabled="!filterForm">Filter</v-btn>-->
    </v-form>

  </v-container>
</template>

<script>
import router from '../../router'

export default {
  name: 'PipelineSCMS',

  props: {
    scmid: {},
  },

  data: () => ({
    isLoading: true,
    filterForm: false,
    scms: [],
    repository: "",
    repositories : [],
    branches: [],
    branch : "",
  }),

  beforeUnmount() {
    this.cancelAutoUpdate();
  },

  computed: {
  },

  methods: {
    async getSCMSData() {
      const auth_enabled = process.env.VUE_APP_AUTH_ENABLED === 'true';

      const restrictedSCM = router.currentRoute.value.query.scmid

      if (auth_enabled) {
        const token = await this.$auth0.getAccessTokenSilently();
        let query = `/api/pipeline/scms`;
        if (restrictedSCM != undefined) {
          query = query + `?scmid=${restrictedSCM}`
        }

        const response = await fetch(query, {
            headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();
        this.isLoading = false
        this.scms = data.scms
      } else {

        let query = `/api/pipeline/scms`;
        if (restrictedSCM != undefined) {
          query = query + `?scmid=${restrictedSCM}`
        }

        const response = await fetch(query);
        const data = await response.json();
        this.isLoading = false
        this.scms = data.scms
      }
      this.repositories = this.scms.map(scm => scm.URL)

      if (this.repositories.length > 0) {
        this.repository = this.repositories[0]
      }
    },

    getScmID(url, branch) {
      return this.scms.find(scm => scm.URL === url && scm.Branch === branch).ID
    },

    applyFilter() {
      var scmid = this.getScmID(this.repository, this.branch)
      this.$emit('update-scmid', scmid)
    },

    cancelAutoUpdate() {
      clearInterval(this.timer);
    },
  },

  watch: {
      isLoading (val) {
        val && setTimeout(() => {
          this.isLoading = false
        }, 3000)
      },

      repository (val) {
        var b = []
        for (var i =0 ; i < this.scms.length; i++) {
          if (this.scms[i].URL == val) {
              if (this.scms[i].Branch == "main") {
                this.branch = "main"
              }

              if (this.scms[i].Branch == "master" && this.branch == "" ){  
                this.branch = "master"
              }
            b.push(this.scms[i].Branch)
          }
        }

        this.branches = b
        this.applyFilter()
      },

      branch () {
        this.applyFilter()
      },
  },

  async created() {
    try {
      this.getSCMSData()
    } catch (error) {
      console.log(error);
    }
  },
}
</script>
