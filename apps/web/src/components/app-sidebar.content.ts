import { t, type Dictionary } from "intlayer";

const appSidebarDictionary = {
  key: "app-sidebar",
  content: {
    groups: [
      {
        label: t({ en: "Dashboards", fr: "Tableaux de bord" }),
        items: [
          { title: t({ en: "Dashboard", fr: "Tableau de bord" }), url: "/dashboard" },
          { title: t({ en: "Analytics", fr: "Analytique" }), url: "/admin/analytics" },
          { title: t({ en: "Home", fr: "Accueil" }), url: "/" },
        ],
      },
      {
        label: t({ en: "Auth", fr: "Authentification" }),
        items: [
          { title: t({ en: "Sign In", fr: "Connexion" }), url: "/sign-in" },
          { title: t({ en: "Sign Up", fr: "Inscription" }), url: "/sign-up" },
          {
            title: t({ en: "Forgot Password", fr: "Mot de passe oublié" }),
            url: "/forgot-password",
          },
        ],
      },
      {
        label: t({ en: "Settings", fr: "Paramètres" }),
        items: [
          { title: t({ en: "Account", fr: "Compte" }), url: "/settings/account" },
          { title: t({ en: "Organization", fr: "Organisation" }), url: "/settings/organization" },
          { title: t({ en: "Billing", fr: "Facturation" }), url: "/settings/billing" },
        ],
      },
    ],
    signedIn: t({ en: "Signed in", fr: "Connecté" }),
  },
} satisfies Dictionary;

export default appSidebarDictionary;
