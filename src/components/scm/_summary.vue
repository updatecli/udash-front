<template>
    <v-card>
        <v-card-title
            class="text-center"
        >
            <h2>{{ sanitizeURL(data.URL) }} - {{ data.Branch }}</h2>
        </v-card-title>
    </v-card>
</template>

<script>
export default {
    name: "SCMSummary",
    props: {
        scmid: {},
    },

    data: () => ({
        data: {},
    }),

    methods: {
        sanitizeURL: function(url) {
            if (url === undefined) {
                return "";
            }

            url = url.replace(/https?:\/\//, '');
            url = url.replace(/http?:\/\//, '');
            url = url.replace(/\/$/, '');
            url = url.replace(/\.git$/, '');

            return url;
        },
    },

    async created() {
        try {
            const token = await this.$auth0.getAccessTokenSilently();
            const response = await fetch(`/api/pipeline/scms?scmid=${this.scmid}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await response.json();
            this.data = data.scms[0];
        } catch (error) {
            console.error(error);
        }
    },
}
</script>