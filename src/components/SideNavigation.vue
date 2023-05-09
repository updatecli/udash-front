<template>

    <v-navigation-drawer
        v-model="drawer"
        expand-on-hover
        permanent
        rail
        bottom
        app>
  
        <v-list-item
          height="48"
          prepend-avatar="/updatecli.png"
          title="Menu"
          nav
        ></v-list-item>
  
        <v-divider></v-divider>
  
        <v-list density="compact" nav>
          <v-list-item
            prepend-icon="mdi-home-city"
            title="Home"
            to="/"
            value="home"></v-list-item>
          <v-list-item
            prepend-icon="mdi-satellite-variant"
            title="Pipelines"
            to="/pipelines"
            value="home"></v-list-item>
          <v-list-item
            prepend-icon="mdi-alien"
            title="About"
            to="/about"
            value="about"></v-list-item>
        </v-list>
  
      </v-navigation-drawer>
</template>

<script>
    export default {
        name: 'SideNavigation',
        data: () => ({
            drawer: true,
        }),
    }
</script>