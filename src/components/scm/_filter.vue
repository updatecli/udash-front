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
        item-value="id"
        item-title="text"
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

        <div
          align="center"
          justify="center"
        >
          <v-btn
            @click="applyFilter"
          >Search</v-btn>
        </div>
    </v-form>

    <div class="text-center">
      <v-btn
        v-if="isRestrictedSCM()"
        @click="resetRestrictedSCM"
        color="darken-grey-3"
        variant="outlined"
        justify-center
      >Reset Filter
      </v-btn>
    </div>

  </v-container>
</template>

<script>
import router from '../../router'

export default {
  name: 'PipelineSCMS',

  props: {
    scmid: {
      type: String,
      default: ""
    },
  },

  data: () => ({
    filterForm: false,
    scms: [],
    repository: "",
    repositories : [],
    branches: [],
    branch : "",
    restrictedSCM: ""
  }),

  beforeUnmount() {
    this.cancelAutoUpdate();
  },

  computed: {
  },

  methods: {
    async getSCMSData() {
      this.$emit('loaded', false)
      const auth_enabled = process.env.VUE_APP_AUTH_ENABLED === 'true';

      let query = `/api/pipeline/scms`;

      if (this.restrictedSCM != "") {
        query = query + `?scmid=${this.restrictedSCM}`
      }

      if (auth_enabled) {
        const token = await this.$auth0.getAccessTokenSilently();

        const response = await fetch(query, {
            headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();
        this.scms = data.scms
      } else {

        const response = await fetch(query);
        const data = await response.json();
        this.scms = data.scms
      }

      let urlArray = []
      this.repositories = []
      for (var i = 0 ; i < this.scms.length; i++) {
        if (urlArray.includes(this.scms[i].URL)) {
          continue
        }
        urlArray.push(this.scms[i].URL)

        this.repositories.push({
          id: this.scms[i].URL,
          text: this.prettifyURL(this.scms[i].URL)
        })

        if ( i == 0) {
          this.repository = this.scms[i].URL
          this.branch = this.scms[i].Branch
          this.applyFilter()
          this.$emit('loaded', true)
        }
      }

    },

    isRestrictedSCM() {
      return this.restrictedSCM != ""
    },

    resetRestrictedSCM() {
      const queryParams = { ...router.currentRoute.query }
      delete queryParams.scmid
      router.replace({ query: queryParams })

      this.restrictedSCM = ""
      this.getSCMSData()
    },

    prettifyURL: function(url) {
       if (url === undefined) {
           return "";
       }

       url = url.replace(/https?:\/\//, '');
       url = url.replace(/http?:\/\//, '');
       url = url.replace(/\/$/, '');
       url = url.replace(/\.git$/, '');

       return url;
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
      repository (val) {
        var newRepositoryBranches = []
        for (var i =0 ; i < this.scms.length; i++) {
          if (this.scms[i].URL == val) {
            if (newRepositoryBranches.includes(this.scms[i].Branch)) {
              continue
            }
              newRepositoryBranches.push(this.scms[i].Branch)
          }
        }

        if (newRepositoryBranches.length == 0) {
          this.branches = []
          this.branch = ""
          return
        }else {
          this.branches = newRepositoryBranches
          this.branch = newRepositoryBranches[0]
        }
      },

      restrictedSCM () {
        this.getSCMSData()
      }
  },

  async created() {
    try {
        if (router.currentRoute.value.query.scmid != undefined) {
          this.restrictedSCM = router.currentRoute.value.query.scmid
        } else {
          this.getSCMSData()
        }
    } catch (error) {
      console.log(error);
    }
  },
}
</script>
