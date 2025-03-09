# Skillanthropy

This website serves as a dynamic hub where software engineers, data scientists, UX/UI designers, and other tech professionals can discover and engage in volunteer opportunities with non-profit organizations and charities. It's essentially a task board tailored for tech-related projects that make a positive impact on society.

## Meilisearch setup

## Zitadel set up steps

1. Run Docker compose
   If Zitadel cannot start and repeatedly restarts, it might be having trouble inserting data into postgres. Run a docker container prune to delete stale data in the posgres pod.

2. Access Zit behind Traefik at http://127.0.0.1.sslip.io:7200
3. Import organisation config using pat token(created locally under machinekey folder) through postman, using Bear Token authorisation
4. Make skillanthropy default organisation
5. Add localhost:5173 as default redirect uri at the bottom of the login behaviour and security sections
6. Update client id application environment variable, find under projects named skillanthropy, and zitadel application named skillanthropy
7. For users to sign up, an SMTP provider will need to be created in zitadel setting
