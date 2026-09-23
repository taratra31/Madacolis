/**
 * Spécification OpenAPI 3.0 de l'API MadaColis.
 * Servie par Swagger UI sur GET /api/v1/docs.
 */

export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "MadaColis API",
    version: "1.0.0",
    description: "API de la plateforme de livraison de colis Madagascar ↔ France. Authentification par JWT (Bearer).",
    contact: { name: "MadaColis" },
  },
  servers: [{ url: "/api/v1", description: "API locale" }],
  tags: [
    { name: "Système", description: "Santé et informations" },
    { name: "Authentification", description: "Inscription, connexion, profil" },
    { name: "Adresses", description: "Gestion des adresses du compte" },
    { name: "Administration", description: "Gestion de la plateforme (ADMIN / AGENT)" },
    { name: "Audit", description: "Journal d'audit" },
  ],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          email: { type: "string", nullable: true },
          phone: { type: "string" },
          role: { type: "string", enum: ["CUSTOMER", "AGENT", "ADMIN"] },
          country: { type: "string", nullable: true },
          city: { type: "string", nullable: true },
          address: { type: "string", nullable: true },
          isActive: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Address: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          label: { type: "string" },
          country: { type: "string" },
          city: { type: "string" },
          region: { type: "string", nullable: true },
          addressLine: { type: "string" },
          postalCode: { type: "string", nullable: true },
          phone: { type: "string" },
          latitude: { type: "number", nullable: true },
          longitude: { type: "number", nullable: true },
          isDefault: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Shipment: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          trackingNumber: { type: "string" },
          originCountry: { type: "string" },
          originCity: { type: "string" },
          destinationCountry: { type: "string" },
          destinationCity: { type: "string" },
          serviceType: { type: "string", enum: ["STANDARD", "EXPRESS", "ECONOMY"] },
          status: { type: "string", enum: ["PENDING", "RECEIVED", "IN_TRANSIT", "IN_CUSTOMS", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"] },
          totalWeight: { type: "number" },
          declaredValue: { type: "number" },
          estimatedPrice: { type: "number" },
          currency: { type: "string", enum: ["EUR", "MGA", "USD"] },
        },
      },
      Payment: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          paymentReference: { type: "string" },
          provider: { type: "string", enum: ["MVOLA", "ORANGE_MONEY", "AIRTEL_MONEY", "CARD", "CASH"] },
          method: { type: "string", enum: ["MOBILE_MONEY", "CARD", "CASH"] },
          amount: { type: "number" },
          currency: { type: "string", enum: ["EUR", "MGA", "USD"] },
          status: { type: "string", enum: ["PENDING", "PAID", "FAILED", "REFUNDED"] },
          transactionId: { type: "string", nullable: true },
          paidAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      PricingRule: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          originCountry: { type: "string" },
          destinationCountry: { type: "string" },
          serviceType: { type: "string", enum: ["STANDARD", "EXPRESS", "ECONOMY"] },
          basePrice: { type: "number" },
          pricePerKg: { type: "number" },
          pricePerKm: { type: "number", nullable: true },
          minimumPrice: { type: "number" },
          currency: { type: "string", enum: ["EUR", "MGA", "USD"] },
          isActive: { type: "boolean" },
        },
      },
      AuditLog: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          action: { type: "string" },
          entityType: { type: "string" },
          entityId: { type: "string" },
          oldValues: { type: "object", nullable: true, additionalProperties: true },
          newValues: { type: "object", nullable: true, additionalProperties: true },
          ipAddress: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          user: { $ref: "#/components/schemas/UserRef" },
        },
      },
      UserRef: {
        type: "object",
        properties: { id: { type: "string" }, name: { type: "string" }, email: { type: "string", nullable: true } },
      },
      ApiResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          code: { type: "string" },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          token: { type: "string" },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer" },
          pageSize: { type: "integer" },
          total: { type: "integer" },
          totalPages: { type: "integer" },
        },
      },
    },
  },
  paths: {
    "/": {
      get: {
        tags: ["Système"],
        summary: "Liste des endpoints",
        security: [],
        responses: { "200": { description: "OK" } },
      },
    },
    "/health": {
      get: {
        tags: ["Système"],
        summary: "Health check",
        security: [],
        responses: { "200": { description: "Le serveur fonctionne" } },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Authentification"],
        summary: "Créer un compte",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "phone", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  phone: { type: "string" },
                  password: { type: "string", minLength: 8 },
                  country: { type: "string" },
                  city: { type: "string" },
                  address: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Compte créé", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } }, "409": { $ref: "#/components/responses/Conflict" } },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Authentification"],
        summary: "Connexion (email ou téléphone)",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["identifier", "password"],
                properties: { identifier: { type: "string" }, password: { type: "string" } },
              },
            },
          },
        },
        responses: { "200": { description: "Connexion réussie", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } }, "401": { $ref: "#/components/responses/Unauthorized" } },
      },
    },
    "/auth/logout": {
      post: { tags: ["Authentification"], summary: "Déconnexion", responses: { "200": { description: "Déconnecté" } } },
    },
    "/auth/me": {
      get: { tags: ["Authentification"], summary: "Profil courant", responses: { "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, user: { $ref: "#/components/schemas/User" } } } } } }, "401": { $ref: "#/components/responses/Unauthorized" } } },
    },
    "/auth/profile": {
      put: {
        tags: ["Authentification"],
        summary: "Mettre à jour le profil",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { name: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, country: { type: "string" }, city: { type: "string" }, address: { type: "string" } },
              },
            },
          },
        },
        responses: { "200": { description: "Profil mis à jour" } },
      },
    },
    "/auth/password": {
      put: {
        tags: ["Authentification"],
        summary: "Changer le mot de passe",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["currentPassword", "newPassword"],
                properties: { currentPassword: { type: "string" }, newPassword: { type: "string", minLength: 8 } },
              },
            },
          },
        },
        responses: { "200": { description: "Mot de passe modifié" }, "401": { $ref: "#/components/responses/Unauthorized" } },
      },
    },
    "/addresses": {
      get: { tags: ["Adresses"], summary: "Mes adresses", responses: { "200": { description: "OK" } } },
      post: {
        tags: ["Adresses"],
        summary: "Créer une adresse",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["label", "country", "city", "addressLine", "phone"],
                properties: {
                  label: { type: "string" },
                  country: { type: "string" },
                  city: { type: "string" },
                  region: { type: "string" },
                  addressLine: { type: "string" },
                  postalCode: { type: "string" },
                  phone: { type: "string" },
                  latitude: { type: "number" },
                  longitude: { type: "number" },
                  isDefault: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Adresse créée", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, address: { $ref: "#/components/schemas/Address" } } } } } } },
      },
    },
    "/addresses/{id}": {
      get: { tags: ["Adresses"], summary: "Adresse par id", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "OK" }, "404": { $ref: "#/components/responses/NotFound" } } },
      put: { tags: ["Adresses"], summary: "Mettre à jour une adresse", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Address" } } } }, responses: { "200": { description: "Mise à jour effectuée" } } },
      delete: { tags: ["Adresses"], summary: "Supprimer une adresse", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Adresse supprimée" } } },
    },
    "/admin/dashboard": {
      get: {
        tags: ["Administration"],
        summary: "Statistiques globales (ADMIN)",
        description: "Compteurs, revenus, flux, tendance 30 jours, top routes, répartition par statut/service.",
        responses: { "200": { description: "OK" } },
      },
    },
    "/admin/users": {
      get: {
        tags: ["Administration"],
        summary: "Lister les utilisateurs (ADMIN)",
        parameters: [
          { name: "q", in: "query", schema: { type: "string" }, description: "Recherche nom/email/téléphone" },
          { name: "role", in: "query", schema: { type: "string" }, description: "Filtre rôle" },
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "pageSize", in: "query", schema: { type: "integer" } },
        ],
        responses: { "200": { description: "OK" } },
      },
    },
    "/admin/users/{id}": {
      put: {
        tags: ["Administration"],
        summary: "Modifier rôle / activité d'un utilisateur (ADMIN)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { role: { type: "string", enum: ["CUSTOMER", "AGENT", "ADMIN"] }, isActive: { type: "boolean" } },
              },
            },
          },
        },
        responses: { "200": { description: "Utilisateur mis à jour" }, "400": { $ref: "#/components/responses/BadRequest" } },
      },
      delete: {
        tags: ["Administration"],
        summary: "Supprimer un utilisateur (ADMIN)",
        description: "Supprime le compte et ses données (adresses, colis, paiements). L'administrateur ne peut pas se supprimer lui-même.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Utilisateur supprimé" }, "400": { $ref: "#/components/responses/BadRequest" }, "404": { $ref: "#/components/responses/NotFound" } },
      },
    },
    "/admin/shipments": {
      get: {
        tags: ["Administration"],
        summary: "Lister les colis (ADMIN/AGENT)",
        parameters: [{ name: "q", in: "query", schema: { type: "string" }, description: "Numéro de tracking" }, { name: "status", in: "query", schema: { type: "string" } }, { name: "page", in: "query", schema: { type: "integer" } }, { name: "pageSize", in: "query", schema: { type: "integer" } }],
        responses: { "200": { description: "OK" } },
      },
    },
    "/admin/shipments/{id}/status": {
      put: {
        tags: ["Administration"],
        summary: "Mettre à jour le statut d'un colis (ADMIN)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["PENDING", "RECEIVED", "IN_TRANSIT", "IN_CUSTOMS", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"] },
                  comment: { type: "string" },
                  location: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Statut mis à jour (historique ajouté)" } },
      },
    },
    "/admin/payments": {
      get: {
        tags: ["Administration"],
        summary: "Lister les paiements (ADMIN/AGENT)",
        parameters: [{ name: "status", in: "query", schema: { type: "string" } }, { name: "page", in: "query", schema: { type: "integer" } }, { name: "pageSize", in: "query", schema: { type: "integer" } }],
        responses: { "200": { description: "OK" } },
      },
    },
    "/admin/pricing-rules": {
      get: { tags: ["Administration"], summary: "Lister les règles tarifaires (ADMIN/AGENT)", responses: { "200": { description: "OK" } } },
      post: {
        tags: ["Administration"],
        summary: "Créer une règle tarifaire (ADMIN)",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/PricingRule" } } } },
        responses: { "201": { description: "Règle créée" }, "409": { $ref: "#/components/responses/Conflict" } },
      },
    },
    "/admin/pricing-rules/{id}": {
      put: {
        tags: ["Administration"],
        summary: "Modifier une règle tarifaire (ADMIN)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/PricingRule" } } } },
        responses: { "200": { description: "Règle mise à jour" } },
      },
      delete: {
        tags: ["Administration"],
        summary: "Supprimer une règle tarifaire (ADMIN)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Règle supprimée" }, "404": { $ref: "#/components/responses/NotFound" } },
      },
    },
    "/admin/audits": {
      get: {
        tags: ["Audit"],
        summary: "Journal d'audit (ADMIN)",
        parameters: [{ name: "action", in: "query", schema: { type: "string" } }, { name: "page", in: "query", schema: { type: "integer" } }, { name: "pageSize", in: "query", schema: { type: "integer" } }],
        responses: { "200": { description: "OK" } },
      },
    },
  },
  responses: {
    Unauthorized: { description: "Non authentifié" },
    Forbidden: { description: "Accès refusé" },
    NotFound: { description: "Ressource introuvable" },
    Conflict: { description: "Conflit (ressource dupliquée)" },
    BadRequest: { description: "Requête invalide" },
  },
} as const;