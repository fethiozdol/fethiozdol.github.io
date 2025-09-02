// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "about",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-blog",
          title: "blog",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/blog/";
          },
        },{id: "nav-cv",
          title: "cv",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/cv/";
          },
        },{id: "nav-repositories",
          title: "repositories",
          description: "GitHub stats",
          section: "Navigation",
          handler: () => {
            window.location.href = "/repositories/";
          },
        },{id: "dropdown-terms",
              title: "terms",
              description: "",
              section: "Dropdown",
              handler: () => {
                window.location.href = "/terms/";
              },
            },{id: "dropdown-cookies",
              title: "cookies",
              description: "",
              section: "Dropdown",
              handler: () => {
                window.location.href = "/cookies/";
              },
            },{id: "post-kickstarting-your-startup-with-devops-from-day-zero-part-1",
        
          title: "Kickstarting Your Startup with DevOps from Day Zero – Part 1",
        
        description: "This blog series aim to stop you delaying DevOps for your new startup.In the first part of this series, I&#39;ll talk about our architecture principles and our design thinking which led us to organize our AWS environments and choose tools and services.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2024/ht-startup-w-devops-p01/";
          
        },
      },{id: "books-the-godfather",
          title: 'The Godfather',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/the_godfather/";
            },},{id: "news-this-is-my-pattern-blog-goes-live-with-its-first-post",
          title: 'This Is My Pattern blog goes live with its first post!',
          description: "",
          section: "News",},{id: "news-i-m-excited-to-share-that-i-ve-joined-vehicularis-ltd-as-a-co-founder-we-re-building-a-mobile-app-that-aims-to-empower-cars-and-elevate-journeys-as-i-m-going-to-be-working-on-a-new-project-from-scratch-i-ve-decided-to-stop-working-on-the-blog-series-kickstarting-your-startup-with-devops-from-day-zero-and-start-a-new-series-based-on-my-experiences-and-insights-gained-while-building-this-app",
          title: 'I’m excited to share that I’ve joined Vehicularis Ltd as a Co-Founder! We’re...',
          description: "",
          section: "News",},{id: "news-we-re-gathering-valuable-feedback-to-improve-the-app-before-its-official-launch-teshub-s-version-alpha-has-been-a-great-success-with-14-volunteering-users-testing-our-app-version-beta-is-set-to-launch-soon-incorporating-user-feedback-and-new-features",
          title: 'We’re gathering valuable feedback to improve the app before its official launch. Teshub’s...',
          description: "",
          section: "News",},{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%66%65%74%68%69@%74%68%69%73%69%73%6D%79%70%61%74%74%65%72%6E.%63%6F%6D", "_blank");
        },
      },{
        id: 'social-linkedin',
        title: 'LinkedIn',
        section: 'Socials',
        handler: () => {
          window.open("https://www.linkedin.com/in/mfethio", "_blank");
        },
      },{
        id: 'social-rss',
        title: 'RSS Feed',
        section: 'Socials',
        handler: () => {
          window.open("/feed.xml", "_blank");
        },
      },{
        id: 'social-x',
        title: 'X',
        section: 'Socials',
        handler: () => {
          window.open("https://twitter.com/mfethio", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
