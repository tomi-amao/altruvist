# Skillanthropy

This website serves as a dynamic hub where software engineers, data scientists, UX/UI designers, and other tech professionals can discover and engage in volunteer opportunities with non-profit organizations and charities. It's essentially a task board tailored for tech-related projects that make a positive impact on society.

Elastic and Kibana Set up steps

1. Run docker compose
2. Access Kibana at localhost:5601

   1. Log in to Kibana as the elastic user with the password that was generated when you started Elasticsearch. Reset the default elastic user password using the following command
      ```
      docker exec -it elasticsearch /usr/share/elasticsearch/bin/elasticsearch-reset-password -u elastic
      ```
   2. Update kibana_system password if kibana is not loading:

      ```
      docker exec -it <elastic container id> bash

      ./bin/elasticsearch-reset-password --username kibana_system -i

      <enter the kibana_system Password>
      ```

To ingest existing data, run a connector service for each Mongodb collection:

3. Create and Configure Elastic connector using api
   1. Send API requests against elastic service to create and configure elastic connector
   2. Update your api post request method to include the authorisation token in the header: ApiKey _key_
4. Create elastic connector service container:
   1. docker run --name charities-connector -v ./config/elastic-connectors/charities-connector-config:/config --network skillanthropy_elastic --tty --rm docker.elastic.co/enterprise-search/elastic-connectors:8.16.1 /app/bin/elastic-ingest -c /config
   2. docker run --name tasks-connector -v ./config/elastic-connectors/tasks-connector-config:/config --network skillanthropy_elastic --tty --rm docker.elastic.co/enterprise-search/elastic-connectors:8.16.1 /app/bin/elastic-ingest -c /config
   3. docker run --name users-connector -v ./config/elastic-connectors/users-connector-config:/config --network skillanthropy_elastic --tty --rm docker.elastic.co/enterprise-search/elastic-connectors:8.16.1 /app/bin/elastic-ingest -c /config
   4. docker run --name taskApplications-connector -v ./config/elastic-connectors/tasksApplications-connector-config:/config --network skillanthropy_elastic --tty --rm docker.elastic.co/enterprise-search/elastic-connectors:8.16.1 /app/bin/elastic-ingest -c /config
5. configure and sync elastic connector

Zitadel set up steps

1. Run Docker compose
   If Zitadel cannot start and repeatedly restarts, it might be having trouble inserting data into postgres. Run a docker container prune to delete stale data in the posgres pod.

2. Access Zit behind Traefik at http://127.0.0.1.sslip.io:7200
3. Import organisation config using pat token(created locally under machinekey folder) through postman, using Bear Token authorisation
4. Make skillanthropy default organisation
5. Add localhost:5173 as default redirect uri at the bottom of the login behaviour and security sections
6. Update client id application environment variable, find under projects named skillanthropy, and zitadel application named skillanthropy
7. For users to sign up, an SMTP provider will need to be created in zitadel setting
