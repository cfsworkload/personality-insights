# Sentiment Analysis

### Social Media Analysis

The Sentiment Analysis application demonstrates how you can use the services **Insights for Twitter**, **dashDB**, and **Personality Insights** to gather and analyze Twitter data.

## Introduction

This Sentiment Analysis sample application has been created so you can deploy it into your personal DevOps space after signing up for Bluemix and DevOps Services. You will
attach the **Insights for Twitter**, **dashDB**, and **Personality Insights** services.
Once the application is set up, you will be able to search for tweets matching certain criteria, load them into a database, and analyze the personality of any Twitter user
for which you have enough data in the database.

If you already know how Bluemix works and you want to automate forking the project, and editing the launch configuration, click the **Deploy to Bluemix** button below. Once the deployment is finished, jump to **How the app works**.

[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy?repository=https://hub.jazz.net/git/cfsworkload/sentiment-analysis-ac)

## Fork the Project to your personal DevOps space

First, fork the publicly accessible repository hosted in http://hub.jazz.net to your personal DevOps space. This will allow you to deploy the app to Bluemix, create
instances of the app, and attach services to the app.

1. Navigate to [the tutorial's repository](https://hub.jazz.net/project/nrchaney/social-media-test/overview).
2. In top right of the page, click **Fork Project**. A pop-up menu will appear where
you'll provide information about the forked project.
3. In **Name your project**, enter a unique name for your project.
4. Select an **Organization** and **Space** for your project, then click **CREATE**.

## Edit launch configurations

Next, you'll edit the launch configurations in order to deploy your app.

1. After the project is successfully forked, click **EDIT CODE** in the upper-right corner of the screen.
2. In the top navigation bar, click the drop-down menu and click the pencil icon to the right of the app name to edit the launch configuration. A dialog box will appear
and you will be required to enter information about where the code will be deploy.
3. Check that your **Target**, **Organization**, and **Space** are correct.
4. Enter a unique name in the **Application Name** field. This creates the route that you will use to navigate to your web app after deployment.
5. Enter the same application name into the **Host** field.
6. Verify that the **Domain** field is correct and click **Save**.
7. Click the play icon to the right of the drop-down menu to deploy your application. This deploys the application to Bluemix with all of the necessary services.

## How the app works

1. Go to the app's web interface by clicking the **Open the Deployed App** button in DevOps Services or by clicking the **Open URL** button in the Bluemix dashboard.
2. At the top of the page there is a query builder you can use to search for Twitter data.
3. The **Twitter Count** button returns the number of tweets that match the given query. The **Twitter Search** button returns 20 tweets that match the query and loads them
into dashDB. (You can change the number of tweets returned in the code.)
4. Once you have enough information from a single Twitter user (usually 20 tweets are enough), you can enter their Twitter username in the **Personality Insights** section.
5. Clicking **Analyze Personality** will send all of the user's tweets to the Personality Insights service, and if there's enough data it will display a textual summary and visualization of the personality data the service returned. If an error is displayed, there may not be enough data from that Twitter user to perform an analysis.

## Search for Twitter data through Insights for Twitter

The **Insights for Twitter** service offers two plans - Free and Entry. The Free plan,
which this application uses, gives access to the Twitter decahose, which is a random sample
of 10% of all tweets. The Free plan allows for 5 million tweets to be returned to a
single Bluemix account. The Entry plan offers access to all tweets, and allows users to
create specialized tracks to more easily filter data.

For more information about the query language, go to the
[Bluemix Twitter documentation](https://www.ng.bluemix.net/docs/services/Twitter/index.html#query_lang).

## View your data using dashDB

Now that the data is in the app, you can also view it in **dashDB**, a relational SQL
database. If you want to take a look at it, navigate to the tile for the service in the
Bluemix Dashboard and click **LAUNCH** in the top right.

You can look at the Twitter data by clicking **Tables** in the left navigation bar,
and you can run your own SQL against the data by going to **Run SQL**.

## Analyze text with Personality Insights

The **Personality Insights** service analyzes text to determine personality traits of
the author. It requires a minimum of 100 words, of which at least 70 must match words in
the lexicon. To compute statistically significant estimates, however, a minimum of 3500
words are required, preferably 6000 or more.

For more information, go to the [Personality Insights documentation](http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/doc/personality-insights/).
