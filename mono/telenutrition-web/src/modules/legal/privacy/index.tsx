/* eslint-disable */
// File is temporary non-I18N version of 2021 privacy document

import React from 'react';
import FormattedMessage from '../../../components/formatted-message';
import LegalWrapper from '../legal-wrapper';
import { useTranslation } from 'react-i18next';

const I18N_MESSAGES = {
  HEADING_NORMAL: {
    id: 'PrivacyPolicy.HeadingNormal',
    defaultMessage: 'Privacy Policy',
  },
  HEADING_SMALL: {
    id: 'PrivacyPolicy.HeadingSmall',
    defaultMessage: `Enterprise Privacy Policy and your Privacy Rights`,
  },
  PAGRAPH_1: {
    id: 'PrivacyPolicy.POne',
    defaultMessage: `Foodsmart is a business name of Zipongo, Inc., and any references herein to Zipongo also refer to Foodsmart.
     Foodsmart is a business name of Zipongo, Inc., and any references herein to Zipongo also refer to Foodsmart. Zipongo, Inc. and its service Zipongo (“Zipongo,” “we,” or “us“) is committed to protecting your privacy.
      We have prepared this Enterprise Privacy Policy to describe to you our practices regarding the Personal Data (as defined below) we collect from users of our Enterprise Site. 
      This Enterprise Privacy Policy is made part of the Zipongo Terms and Conditions (“Terms and Conditions“)foodsmart.com/terms/ /. 
      Capitalized terms not defined in this Enterprise Privacy Policy will have the meanings set forth in the Terms and Conditions. 
      The Zipongo services made available for use viazipongo.com (the “Site”), through your mobile device, including mobile apps, 
      including but not limited to OrderWell, or through the Site (“Service“), you (“you” or the “End User“) are governed separately by the terms and conditions (the “Terms of Service“) that we, Zipongo, Inc. (“Zipongo,” “we,” or “us“) provide on the Site.`,
  },
  PAGRAPH_2: {
    id: 'PrivacyPolicy.PTwo',
    defaultMessage: `By submitting Personal Data through the Enterprise Site, you agree to the
      terms of this Enterprise Privacy Policy and you expressly consent to the
      processing of your Personal Data in accordance with this Enterprise Privacy
      Policy. Your Personal Data may be processed in the country where it was
      collected and in other countries, including the United States, where laws
      regarding processing of Personal Data may be less stringent than the laws
      in your country.`,
  },
  PAGRAPH_3: {
    id: 'PrivacyPolicy.PThree',
    defaultMessage: `Note, Zipongo, Inc. is not a medical group. Any telemedicine or nutritional
      consults obtained through our Site or Service are provided by
      independent medical practitioners and registered dietitians including
      Zipongo Health Provider Group, P.A. (“Zipongo Health”), an independent
      medical group with a network of United States-based health care
      providers (each, a “Provider”). Zipongo Health (or your own medical
      provider if you do not use a Zipongo Health Provider) is responsible
      for providing you with a Notice of Privacy Practices describing its
      collection and use of your health information, not Zipongo. If you do
      not agree to be bound by those terms, you are not authorized to access
      or use our Site and Service, and you must promptly exit our Site and
      Service.`,
  },
  HEADING_1: {
    id: 'PrivacyPolicy.HeadingOne',
    defaultMessage: `1. Types of Data We Collect`,
  },
  PAGRAPH_4: {
    id: 'PrivacyPolicy.PFour',
    defaultMessage: `We collect Personal Data and Anonymous Data from you when you visit the
      Enterprise Site, or send us information or communications, and/or when you
      submit content to our Enterprise Site. “{{strongPersonalData}}”
      means data that allows someone to identify or contact you, including, for
      example, your name, address, location, telephone number, email address, 
      medical history, biometrics (including fingerprints), and health
      information as well as any other non-public information about you that is
  associated with or linked to any of the foregoing data. “{{strongAnonymousData}}” means data that is not associated with or
      linked to your Personal Data; Anonymous Data does not permit the
      identification of individual persons.`,
  },
  PAGRAPH_5: {
    id: 'PrivacyPolicy.PFive',
    defaultMessage: `We receive and store any information you enter on our Enterprise Site or
      otherwise provide to us.`,
  },
  PAGRAPH_6: {
    id: 'PrivacyPolicy.PSix',
    defaultMessage: `We collect Personal Data from you, such as your username, first and last
      name, mailing address, email address, phone number, location, medical
      history, biometrics (including fingerprints), and health information when
      you access the Enterprise Site and submit such information to the
      Enterprise Site.`,
  },
  // PAGRAPH_7: {
  //   id: 'PrivacyPolicy.PSeven',
  //   defaultMessage: `We collect any Personal Data contained in information or content that you
  //     submit to the Enterprise Site, such as name or email.`,
  // },
  PAGRAPH_8: {
    id: 'PrivacyPolicy.PEight',
    defaultMessage: `We collect information that you submit to the Enterprise in Site response to
      surveys or submissions of requests for references or resources.`,
  },
  PAGRAPH_8_5: {
    id: 'PrivacyPolicy.PEightFive',
    defaultMessage: `If you provide feedback to us or contact us via e-mail, we may collect your
     name and email address, as well as any other content included in the e-mail
     or that you submit to us, to send you a reply.`,
  },
  PAGRAPH_9: {
    id: 'PrivacyPolicy.PNine',
    defaultMessage: `You also may provide information to be transmitted to other users of the
      Site or the Services or third parties (collectively, “{{strongUserMessages}}”). Your User Messages are transmitted to
          others at your own risk. Although we limit access to certain pages, please
          be aware that no security measures are perfect or impenetrable.
          Additionally, we cannot control the actions of other users of the Site 
          of the Services with whom you may choose to share your User
          Messages. Therefore, we cannot and do not guarantee that your User Messages
          will not be viewed by unauthorized persons.`,
  },
  // HEADING 1.2 HERE
  PAGRAPH_10: {
    id: 'PrivacyPolicy.PTen',
    defaultMessage: `Our servers (which may be hosted by a secure third-party service provider)
      collect information from you when you visit or use the Enterprise Site,
      such as browser type and version, operating system, platform, Internet
      Protocol (IP) address (a number that is automatically assigned to your
      computer when you use the Internet, which may vary from session to
      session), domain name, and a date/time stamp for your visit.`,
  },
  PAGRAPH_11: {
    id: 'PrivacyPolicy.PEleven',
    defaultMessage: `We use analytics technology to collect information about your use of our
      mobile applications and the Enterprise Site, such as the time and date of
      your use, the duration of your use of various screens, and the features
      that you accessed. We use this data to assess features most preferred or
      most difficult to use, to improve the usability experience for users.`,
  },
  PAGRAPH_12: {
    id: 'PrivacyPolicy.PTwelve',
    defaultMessage: `We may use cookies, Flash cookies, and navigational data like Uniform
      Resource Locators (URLs) on the Enterprise Site to gather information about
      your online activities, such as the date and time of your visit, and the
      information for which you searched and which you viewed. We may also use a
      cookie and/or Flash cookie to save your settings and to provide
      customizable and personalized services (such as to hold your Account
      information). A “cookie” is a small data file placed on your hard drive
      when you visit certain websites. A “Flash cookie” is a small data file
      placed on your hard drive when you visit certain websites that use Adobe
      Flash. You may disable cookies by adjusting the preferences settings of
      your browser. Consult the “Help” feature of your browser for specific
      instructions. If you choose to disable cookies or Flash cookies, some areas of our
      Enterprise Site may not work properly. Our partners may also use their own
      cookies. We do not control the use of these cookies used by partners and
      expressly disclaim responsibility for information collected through them.`,
  },
  PAGRAPH_13: {
    id: 'PrivacyPolicy.PThirteen',
    defaultMessage: `We use software tools such as Flash or JavaScript to collect page
      interaction information such as clicks, drags, and hover-overs, response
      times, errors, and length of visits to certain pages.`,
  },
  PAGRAPH_14: {
    id: 'PrivacyPolicy.PFourteen',
    defaultMessage: `We may use clear gifs (otherwise known as web bugs or web beacons) to
      gather information about your visit to the Enterprise Site, such as what
      you click on and pages and information you viewed. Additionally, be aware
      that partners may also use their own clear gifs, and we do not control the use
      of these by partners and expressly disclaim responsibility for information
      collected through them. Clear gifs are tiny graphics with a unique
      identifier, similar in function to cookies. In contrast to cookies, which
      are placed on a user’s hard drive, clear gifs are embedded invisibly on web
      pages.`,
  },
  PAGRAPH_15: {
    id: 'PrivacyPolicy.PFifteen',
    defaultMessage: `Some web browsers permit you to broadcast a signal to websites and online
      services indicating a preference that they “do not track” your online
      activities. At this time, we do not honor such signals, but we currently do
      not use automated data collection technologies to collect information about
      your online activities over time and across third-party websites or other
      online services (behavioral tracking).`,
  },
  // header 2 here
  PAGRAPH_16: {
    id: 'PrivacyPolicy.PSixteen',
    defaultMessage: `We may display your name and public information (“{{strongPublicContent}}” as defined in the <a href="https://foodsmart.co/terms/">Foodsmart Terms and Conditions</a>), 
      such as your comments, blog posts, when you post Public Content to or use
      forums, blogs, and other user community features of the Enterprise Site
      (collectively, “{{strongPublicAreas}}“). A subset of your public
      content is available to the general public and other users on the
      Enterprise Site. If you associate your name with your Public Content, the
      people to whom you have revealed your name will be able to personally
      identify your activities on our Enterprise Site. You may also choose to
      share on the Enterprise Site or a Third-Party Service, via comments, your
      location, and data, (collectively, “{{strongSharedContent}}”). If
      you use Public Areas, post Public Content, share Shared Content, or send
      emails or other messages to other persons, you should be aware that they
      can read, collect or use any Personal Data contained therein. We are not
      responsible for the Personal Data you choose to submit in the Public Areas,
      in your Public Content, Shared Content, or that you send to others.`,
  }, // <a href="https://foodsmart.co/terms/">Foodsmart Terms and Conditions</a>)
  // header 3 here
  PAGRAPH_17: {
    id: 'PrivacyPolicy.PSeventeen',
    defaultMessage: `We use Google Analytics, a web analytics service provided by Google, Inc.
      to collect certain information relating to your use of the Site. Google
      Analytics uses cookies to help the Site analyze how users use the site. You
      can find out more about how Google uses data when you visit our Site by
      visiting “How Google uses data when you use our partners' sites or apps”,
      (located :
        <a href="http://www.google.com/policies/privacy/partners/">
          www.google.com/policies/privacy/partners/
        </a>
      ).`,
  }, //<a href="http://www.google.com/policies/privacy/partners/">www.google.com/policies/privacy/partners/</a>
  PAGRAPH_18: {
    id: 'PrivacyPolicy.PEighteen',
    defaultMessage: `We allow you to access third-party services (“{{strongThirdPartyServices}}“), such as, but not limited to,
      Google, to share content with those services. Some Third-Party Services may
      provide us with information to help improve and personalize your experience on
      the Enterprise Site or provide Shared Content. It is your choice to login
      to Third-Party Services, such as Facebook; you are not required to do so.
      Once logged into a Third-Party Service, you can control your privacy
      settings on the Service to block the sharing to Third-Party Services of
      your content and the importation of friend and contact information from
      Third-Party Services. You can also adjust your privacy settings with the
      Third-Party Service. We also may offer a feature allowing you to invite
      friends to join the Enterprise Site by providing their contact information
      or by importing their contact information from your address book on a Third
      Party Service, such as, but not limited to, Gmail from Google, or your
      address book on your mobile device. You agree that we may store and use
      your friends’ contact information to invite them to join and connect with
      you on the Enterprise Site. Your friends may choose to ignore your friend
      requests or the opportunity to access Zipongo.`,
  },
  PAGRAPH_19: {
    id: 'PrivacyPolicy.PNineteen',
    defaultMessage: `We are not responsible for the practices employed by any websites or
      services linked to or from our Enterprise Site, including the information
      or content contained within them. Please remember that when you use a link
      to go from our Service to another website or service, our Enterprise 
      Privacy Policy does not apply to those third-party websites or
      services. Your browsing and interaction on any third-party website or
      service, including those that have a link on our website, are subject to
      that third party’s own rules and policies. In addition, you agree that we
      are not responsible and do not have control over any third parties that you
      authorize to access your Personal Data. If you are using a third-party
      website or service and you allow them to access your Personal Data, you do
      so at your own risk.{{strongUserOfYourData}}`,
  },
  // 4.1 header here
  PAGRAPH_20: {
    id: 'PrivacyPolicy.PTwenty',
    defaultMessage: `In general, Personal Data you submit or authorize a third party to submit
      (such as an employer) to us is used to provide you with a customized
      experience, aid us in serving you better, and to respond to your requests.`,
  },
  PAGRAPH_21: {
    id: 'PrivacyPolicy.PTwentyOne',
    defaultMessage: `We use your Personal Data to:`,
  },
  PAGRAPH_22: {
    id: 'PrivacyPolicy.PTwentyTwo',
    defaultMessage: `Facilitate the creation of and secure your access on our network;`,
  },
  PAGRAPH_23: {
    id: 'PrivacyPolicy.PTwentyThree',
    defaultMessage: `Identify you as a user in our system;`,
  },
  PAGRAPH_24: {
    id: 'PrivacyPolicy.PTwentyFour',
    defaultMessage: `To provide our Services to you;`,
  },
  PAGRAPH_25: {
    id: 'PrivacyPolicy.PTwentyFive',
    defaultMessage: `Provide the services and customer support you request;`,
  },
  PAGRAPH_26: {
    id: 'PrivacyPolicy.PTwentySix',
    defaultMessage: `Analyze request and usage patterns, diagnose problems with our server and
      administer our Enterprise Site;`,
  },
  PAGRAPH_27: {
    id: 'PrivacyPolicy.PTwentySeven',
    defaultMessage: `Improve the quality of experience and provide you a personalized
      experience when you use the Enterprise Site;`,
  },
  PAGRAPH_28: {
    id: 'PrivacyPolicy.PTwentyEight',
    defaultMessage: `Send you administrative e-mail notifications, such as security or support
      and maintenance advisories (the e-mails we send may contain code that
      enables our database to track your usage of the e-mail, such as whether the
      e-mail was opened and/or what links (if any) were clicked);`,
  },
  PAGRAPH_29: {
    id: 'PrivacyPolicy.PTwentyNine',
    defaultMessage: `Respond to your inquiries related to employment opportunities or other
      requests;`,
  },
  PAGRAPH_30: {
    id: 'PrivacyPolicy.PThirty',
    defaultMessage: `Send you e-mail messages, texts or SMS messages, targeted social media or
      digital media ads, or postal mail informing you of our products and
      services and also third-party products and services we believe may be of
      interest to you;`,
  },
  PAGRAPH_31: {
    id: 'PrivacyPolicy.PThirtyOne',
    defaultMessage: `to fulfill any other purpose for which you provide it (for example to
        facilitate the services of Zipongo Health);`,
  },
  PAGRAPH_32: {
    id: 'PrivacyPolicy.PThirtyTwo',
    defaultMessage: `to carry out our obligations and enforce our rights arising from any
      contracts entered into between you and us, including for billing and
      collection;`,
  },
  PAGRAPH_33: {
    id: 'PrivacyPolicy.PThirtyThree',
    defaultMessage: `to notify you about changes to our Site, or any products or services we
      offer or provide though them; and`,
  },
  PAGRAPH_34: {
    id: 'PrivacyPolicy.PThirtyFour',
    defaultMessage: `for any other purpose with your consent.`,
  },
  PARAGRAPH_34_ammend: {
    id: 'PrivacyPolicy.PThirtyFourAmmend',
    defaultMessage: 'No mobile information will be shared with third parties/affiliates for marketing/promotional purposes. All other categories exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.'
  },
  // header 4.2 hrere
  PAGRAPH_35: {
    id: 'PrivacyPolicy.PThirtyFive',
    defaultMessage: `If we sell or otherwise transfer part or in whole Zipongo or our
      assets to another organization (e.g., in the course of a transaction like a
      merger, acquisition, bankruptcy, dissolution, liquidation), your
      information such as name and email address, Personal Data and any other
      information collected through the Enterprise Site may be among the items
      sold or transferred. You will continue to own your Personal Data. The buyer
      or transferee will be required to honor the commitments we have made in
      this Enterprise Privacy Policy.`,
  },
  // header 5 here
  // header 5.1 here
  PAGRAPH_36: {
    id: 'PrivacyPolicy.PThirtySix',
    defaultMessage: `We may share your Personal Data with third-party service providers under
      contract to perform functions on our behalf. Examples include sending
      postal mail or e-mail, storing data, analyzing data, performing quality
      assurance, providing technical support, providing marketing assistance,
      verifying identity, and providing customer service. These third parties may
      have access to your Personal Data only as needed to perform their
      functions. Our payment processors’ privacy policies may be found at {{stripeLink}},
      and {{paypalLink}};`,
  },
  PAGRAPH_37: {
    id: 'PrivacyPolicy.PThirtySeven',
    defaultMessage: `We may share your Personal Data with any companies that acquire our
      company or our assets. That company will possess the Personal Data
      collected by us and will assume the rights and obligations regarding your
      Personal Data as described in this Enterprise Privacy Policy.`,
  },
  PAGRAPH_38: {
    id: 'PrivacyPolicy.PThirtyEight',
    defaultMessage: `While we do not have a parent company, any subsidiaries, joint ventures,
      or other companies under common control (collectively, “<strong>{{strongAffiliates}}</strong>”), we may in the future. We may share some or
          all of your Personal Data with these Affiliates, in which case we will
          require our Affiliates to honor this Enterprise Privacy Policy.`,
  },
  PAGRAPH_39: {
    id: 'PrivacyPolicy.PThirtyNine',
    defaultMessage: `We may disclose your Personal Data if we have a good faith belief that
      disclosure is necessary to: (1) comply with the law or with legal process
      served on us; (2) protect and defend the rights or property of us or our
      users; (3) act in an emergency to protect someone’s safety; or (4)
      investigate any violation or potential violation of the law, this
      Enterprise Privacy Policy, or the Agreement.`,
  },
  PAGRAPH_40: {
    id: 'PrivacyPolicy.PFourty',
    defaultMessage: `We may share your Personal Data to fulfill the purpose for which you
      provide it. For example, we may disclose your personal information to a
      Provider.`,
  },
  PAGRAPH_41: {
    id: 'PrivacyPolicy.PFourtyOne',
    defaultMessage: `We may share your Personal Data for any other purpose disclosed by us
      when you provide the information.`,
  },
  PAGRAPH_42: {
    id: 'PrivacyPolicy.PFourtyTwo',
    defaultMessage: `We may share your Personal Data with your consent for any other purpose.`,
  },
  // header 5.2 here
  PAGRAPH_43: {
    id: 'PrivacyPolicy.PFourtyThree',
    defaultMessage: `You may share User Content and/or Personal Data through various Enterprise
      Site functionalities, including but not limited to sharing via email or
  invite external contacts to access the Enterprise Site. See the <a href="https://foodsmart.co/terms/">Foodsmart Terms and Conditions</a>
      for more detail on information that you share.`,
  },
  // header 6 here
  PAGRAPH_44: {
    id: 'PrivacyPolicy.PFourtyFour',
    defaultMessage: `We will have the right to use, and share with third parties, Anonymous Data
      for any purpose and in any manner. Anonymous Data includes non-personally
      identifiable data we create from Personal Data (in accordance with
      applicable law) by excluding information that makes such data personally
      identifiable. For example, Anonymous Data may be used or disclosed in
      connection with research studies or may be used to improve the quality of
      use of the Enterprise Site.`,
  },
  // header 7 here
  // header 7.1 here
  PAGRAPH_45: {
    id: 'PrivacyPolicy.PFourtyFive',
    defaultMessage: `We offer you choices regarding the collection, use, and sharing of your
      Personal Data. We may periodically send you free newsletters and emails
      about new services, products, or other noteworthy news, or that may contain
      advertisements for third parties. When you receive newsletters or
      promotional communications from us, you may indicate a preference to stop
      receiving further communications from us and you will have the opportunity
      to “opt-out” by following the unsubscribe instructions provided in the
  email you receive, by changing your Settings, or by contacting us at {{strongSupportEmail}} . Should you opt-out of receiving
      future mailings, we may share your email address with third parties to
      ensure that you do not receive further communications from third parties.
      Despite your indicated email preferences, we may send you notices of any
      updates to our Agreement, Enterprise Privacy Policy, or other terms for the
      Service or Enterprise Site.`,
  },
  // header 7.2 here
  PAGRAPH_46: {
    id: 'PrivacyPolicy.PFourtySix',
    defaultMessage: `You may change any of your Personal Data by contacting us at {{strongSupportEmail}}. You may request deletion of your
      Personal Data by contacting us at {{strongSupportEmail}}, but please note that we may be
          required (by law or otherwise) to keep this information and not delete it
          (or to keep this information for a certain time, in which case we will
          comply with your deletion request only after we have fulfilled such
          requirements). When we delete any information, it will be deleted from the
          active database, but it may remain in our archives.`,
  },
  // header 8 here
  PAGRAPH_47: {
    id: 'PrivacyPolicy.PFourtySeven',
    defaultMessage: `The Enterprise Site is not currently directed to children under the age of
      13. We respect the privacy of parents and children and are committed to
      complying with the Children’s Online Privacy Protection Act (“COPPA”). We
      do not knowingly collect or solicit any information from anyone under the
      age of 13 or knowingly allow such persons to register for the Enterprise
      Site. In the event that we learn that we have collected personal
      information from a child under age 13 without parental consent, we will
      delete that information as quickly as possible. If you believe that we
      might have any information from or about a child under 13, please contact
      us immediately.`,
  },
  // header 9 here
  PAGRAPH_48: {
    id: 'PrivacyPolicy.PFourtyEight',
    defaultMessage: `We have commercially reasonable security measures in place to help protect
      against loss, misuse, and alteration of your Personal Data in our
      possession, including securely storing any Personal Data collected as
      encrypted data. No method of transmission over the Internet, or method of
      electronic storage, is 100% secure, however. Therefore, while Zipongo uses
      reasonable efforts to protect your Personal Data, Zipongo cannot guarantee
      its absolute security.`,
  },
  // header 10 here
  PAGRAPH_49: {
    id: 'PrivacyPolicy.PFourtyNine',
    defaultMessage: `Zipongo may modify or update this Enterprise Privacy Policy from time to
      time, so please review it periodically. We may provide you with additional forms
      of notice of modifications or updates as appropriate under the
      circumstances. Your continued use of the Enterprise Site after any
      modification to this Enterprise Privacy Policy will constitute your
      acceptance of such modification.`,
  },
  // header 11
  // header 11.1
  PAGRAPH_50: {
    id: 'PrivacyPolicy.PFifty',
    defaultMessage: `If you are a California resident, California law may provide you with
      additional rights regarding our use of your personal information. To learn
      more about your California privacy rights, visit {{oagLink}}.`,
  },
  // header 11.2
  PAGRAPH_51: {
    id: 'PrivacyPolicy.PFiftyOne',
    defaultMessage: `This Site and the services on this Site are targeted for users in the
      United States of America. Any information you enter on this Site may be
      transferred outside of the European Union to the United States of America
      which does not offer an equivalent level of protection to that required in
      the European Union. In particular, you are advised that the United States
      of America uses a sectoral model of privacy protection that relies on a mix
      of legislation, governmental regulation, and self-regulation. Article 26 of
      the European Union’s Data Protection Directive (Directive 95/46/EC, 1995
      O.J. (L 281) 31) allows for transfer of personal data from the European
      Union to a third country if the individual has unambiguously given his
      consent to the transfer of personal information, regardless of the third
      country’s level of protection. By using this Site or the services, you
      consent to the transfer of all such information to the United States of
      America which may not offer an equivalent level of protection to that
      required in the European Union and to the processing of that information by
      the Zipongo on its servers located in the United States of America as
      described in this Privacy Policy.`,
  },
  // header 12
  PAGRAPH_52: {
    id: 'PrivacyPolicy.PFiftyTwo',
    defaultMessage: `We welcome your comments or questions regarding this Enterprise Privacy
      Policy. Please e-mail us at {{strongSupportEmail}} or
      contact us at the following address:`,
  },
  PAGRAPH_53: {
    //address
    id: 'PrivacyPolicy.PFiftyThree',
    defaultMessage: `ATTN: Privacy Officer
      {{htmlBR}}
          Zipongo, Inc.
      {{htmlBR}}
          595 Pacific Ave.
      {{htmlBR}}
          4th Floor
      {{htmlBR}}
          San Francisco, CA 94133
      {{htmlBR}}
          Telephone: 415-800-2312
      {{htmlBR}}
          Email: support@foodsmart.com`,
  },
  PAGRAPH_54: {
    id: 'PrivacyPolicy.PFiftyFour',
    defaultMessage: `Privacy Notice for California Residents`,
  },
  PAGRAPH_55: {
    id: 'PrivacyPolicy.PFiftyFive',
    defaultMessage: `{{strongEffectiveDate}}: November 2019`,
  },
  PAGRAPH_56: {
    id: 'PrivacyPolicy.PFiftySix',
    defaultMessage: `{{strongLastReviewedOn}}: March 2024`,
  },
  PAGRAPH_57: {
    id: 'PrivacyPolicy.P.FiftySeven',
    defaultMessage: `This {{strongPrivacyNoticeForCaliforniaResidents}} supplements
      the information contained in our privacy policy above and applies solely to
      all visitors, users, and others who reside in the State of California
      (”consumers” or “you”). We adopt this notice to comply with the California
      Consumer Privacy Act of 2018 (CCPA) as amended, and any terms defined in the CCPA have
      the same meaning when used in this notice.`,
  },
  PAGRAPH_58: {
    id: 'PrivacyPolicy.PFiftyEight',
    defaultMessage: `{{strongInformationWeCollect}}`,
  },
  PAGRAPH_59: {
    id: 'PrivacyPolicy.PFiftyNine',
    defaultMessage: `Our Website collects information that identifies, relates to, describes,
      references, is capable of being associated with, or could reasonably be
  linked, directly or indirectly, with a particular consumer or device (”{{strongPersonalInformation}}”). In particular, our website has
      collected the following categories of personal information from its
      consumers within the last twelve (12) months:`,
  },
  PAGRAPH_60: {
    id: 'PrivacyPolicy.PSixty',
    defaultMessage: `{{strongCategoryA}}
      Identifiers`,
  },
  PAGRAPH_61: {
    id: 'PrivacyPolicy.PSixtyOne',
    defaultMessage: `{{strongExamples}}
      A real name, Internet Protocol address, email address, or other similar
      identifiers.`,
  },
  PAGRAPH_62: {
    id: 'PrivacyPolicy.PSixtyTwo',
    defaultMessage: `{{strongCollected}}
      YES`,
  },
  PAGRAPH_63: {
    id: 'PrivacyPolicy.PSixtyThree',
    defaultMessage: `{{strongCategoryB}}
      Personal information categories listed in the California Customer Records
      statute (Cal. Civ. Code § 1798.80(e)).`,
  },
  PAGRAPH_64: {
    id: 'PrivacyPolicy.PSixtyFour',
    defaultMessage: `{{strongExamples}}
      A name, signature, Social Security number, physical characteristics or
      description, address, telephone number, passport number, driver’s license
      or state identification card number, insurance policy number, education,
      employment, employment history, bank account number, credit card number,
      debit card number, or any other financial information, medical information,
      or health insurance information. Some personal information included in this
      category may overlap with other categories.`,
  },
  PAGRAPH_65: {
    id: 'PrivacyPolicy.PSixtyFive',
    defaultMessage: `{{strongCollected}}
      YES, with your consent`,
  },
  PAGRAPH_66: {
    id: 'PrivacyPolicy.PSixtySix',
    defaultMessage: `{{strongCategoryC}}
      Protected classification characteristics under California or federal law.`,
  },
  PAGRAPH_67: {
    id: 'PrivacyPolicy.PSixtySeven',
    defaultMessage: `{{strongExamples}}
      Age (40 years or older), race, color, ancestry, national origin,
      citizenship, religion or creed, marital status, medical condition, physical
      or mental disability, sex (including gender, gender identity, gender
      expression, pregnancy or childbirth and related medical conditions), sexual
      orientation, veteran or military status, genetic information (including
      familial genetic information).`,
  },
  PAGRAPH_68: {
    id: 'PrivacyPolicy.PSixtyEight',
    defaultMessage: `{{strongCollected}}
      YES, with your consent`,
  },
  PAGRAPH_69: {
    id: 'PrivacyPolicy.PSixtyNine',
    defaultMessage: `Personal information does not include:`,
  },
  // below are bullets
  PAGRAPH_70: {
    id: 'PrivacyPolicy.PSeventy',
    defaultMessage: `Publicly available information from government records.`,
  },
  PAGRAPH_71: {
    id: 'PrivacyPolicy.PSeventyOne',
    defaultMessage: `De-identified or aggregated consumer information.`,
  },
  PAGRAPH_72: {
    id: 'PrivacyPolicy.PSeventyTwo',
    defaultMessage: `Information excluded from the CCPA’s scope, like:`,
  },
  PAGRAPH_73: {
    id: 'PrivacyPolicy.P.SeventyThree',
    defaultMessage: `health or medical information covered by the Health Insurance
      Portability and Accountability Act of 1996 (HIPAA) and the California
      Confidentiality of Medical Information Act (CMIA) or clinical trial
      data;`,
  },
  PAGRAPH_74: {
    id: 'PrivacyPolicy.PSeventyFour',
    defaultMessage: `personal information covered by certain sector-specific privacy laws,
      including the Fair Credit Reporting Act (FRCA), the Gramm-Leach-Bliley
      Act (GLBA) or California Financial Information Privacy Act (FIPA), and
      the Driver’s Privacy Protection Act of 1994.`,
  },
  // P
  PAGRAPH_75: {
    id: 'PrivacyPolicy.PSeventyFive',
    defaultMessage: `We obtain the categories of personal information listed above from the
      following categories of sources:`,
  },
  //Bullet
  PAGRAPH_76: {
    id: 'PrivacyPolicy.PSeventySix',
    defaultMessage: `Directly from you. For example, from forms you complete on our website.`,
  },
  PAGRAPH_77: {
    id: 'PrivacyPolicy.PSeventySeven',
    defaultMessage: `Indirectly from you. For example, from observing your actions on our
      website or interactions with our advertisers.`,
  },
  PAGRAPH_78: {
    id: 'PrivacyPolicy.PSeventyEight',
    defaultMessage: `{{strongUseOfPersonalInformation}}`,
  },
  PAGRAPH_79: {
    id: 'PrivacyPolicy.P.SeventyNine',
    defaultMessage: `We may use, or disclose the personal information we collect for one or more
      of the following business purposes:`,
  },
  // <li>
  PAGRAPH_80: {
    id: 'PrivacyPolicy.PEighty',
    defaultMessage: `To fulfill or meet the reason you provided the information. For
      example, if you share your name and contact information to request a
      price quote or ask a question about our products or services, we will
      use that personal information to respond to your inquiry. If you
      provide your personal information to purchase a product or service, we
      will use that information to process your payment and facilitate
      delivery. We may also save your information to facilitate new product
      orders or process returns.`,
  },
  PAGRAPH_81: {
    id: 'PrivacyPolicy.PEightyOne',
    defaultMessage: `To provide you with support and to respond to your inquiries, including
      to investigate and address your concerns and monitor and improve our
      responses.`,
  },
  PAGRAPH_82: {
    id: 'PrivacyPolicy.PEightyTwo',
    defaultMessage: `To respond to law enforcement requests and as required by applicable
      law, court order, or governmental regulations.`,
  },
  PAGRAPH_83: {
    id: 'PrivacyPolicy.PEightyThree',
    defaultMessage: `As described to you when collecting your personal information or as
      otherwise set forth in the CCPA.`,
  },
  PAGRAPH_84: {
    id: 'PrivacyPolicy.PEightyFour',
    defaultMessage: `We will not collect additional categories of personal information or
      use the personal information we collected for materially different,
      unrelated, or incompatible purposes without providing you notice.`,
  },
  // PAGRAPH_85: {
  //   id: 'PrivacyPolicy.PEightyFive',
  //   defaultMessage: `{strongSharingPersonalInformation}`,
  // },
  PAGRAPH_86: {
    id: 'PrivacyPolicy.PEightySix',
    defaultMessage: `We may disclose your personal information to a third party for a business
      purpose [or sell your personal information, subject to your right to
      opt-out of those sales (see <a href="https://www.nva.com/privacy-policy">Personal Information Sales Opt-Out and Opt-In Rights</a>)]. 
      When we disclose personal information for a business purpose, we enter
      a contract that describes the purpose and requires the recipient to both
      keep that personal information confidential and not use it for any purpose
      except performing the contract. [The CCPA prohibits third parties who
      purchase the personal information we hold from reselling it unless you have
      received explicit notice and an opportunity to opt-out of further sales.]`,
  },
  // PAGRAPH_87: {
  //   id: 'PrivacyPolicy.PEightySeven',
  //   defaultMessage: `{{strongDisclosuresOfPersonal}}`,
  // },
  PAGRAPH_88: {
    id: 'PrivacyPolicy.PEightyEight',
    defaultMessage: `In the preceding twelve (12) months, Zipongo has not disclosed personal
      information for a business purpose.`,
  },
  PAGRAPH_89: {
    id: 'PrivacyPolicy.PEightyNine',
    defaultMessage: `{{strongSalesOfPersonalInformation}}`,
  },
  PAGRAPH_90: {
    id: 'PrivacyPolicy.PNinety',
    defaultMessage: `In the preceding twelve (12) months, Zipongo had not sold personal
      information.`,
  },
  // PAGRAPH_91: {
  //   id: 'PrivacyPolicy.PNinetyOne',
  //   defaultMessage: `{{yourRightsAndChoices}}`,
  // },
  PAGRAPH_92: {
    id: 'PrivacyPolicy.PNinetyTwo',
    defaultMessage: `The CCPA provides consumers (California residents) with specific rights
      regarding their personal information. This section describes your CCPA
      rights and explains how to exercise those rights.`,
  },
  // PAGRAPH_93: {
  //   id: 'PrivacyPolicy.PNinetyThree',
  //   defaultMessage: `{{strongAccessToSpecificInformation}}`,
  // },
  PAGRAPH_94: {
    id: 'PrivacyPolicy.PNinetyFour',
    defaultMessage: `You have the right to request that we disclose certain information to you
      about our collection and use of your personal information over the past 12
      months. Once we receive and confirm your verifiable consumer request, we
      will disclose to you:`,
  },
  PAGRAPH_95: {
    id: 'PrivacyPolicy.PNinetyFive',
    defaultMessage: `The categories of personal information we collected about you.`,
  },
  PAGRAPH_96: {
    id: 'PrivacyPolicy.PNinetySix',
    defaultMessage: `The categories of sources for the personal information we collected
      about you.`,
  },
  PAGRAPH_97: {
    id: 'PrivacyPolicy.PNinetySeven',
    defaultMessage: `Our business or commercial purpose for collecting or selling that
      personal information.`,
  },
  PAGRAPH_98: {
    id: 'PrivacyPolicy.PNinetyoEight',
    defaultMessage: `The categories of third parties with whom we share that personal
      information.`,
  },
  PAGRAPH_99: {
    id: 'PrivacyPolicy.PNinetyNine',
    defaultMessage: `The specific pieces of personal information we collected about you
      (also called a data portability request).`,
  },
  PAGRAPH_100: {
    id: 'PrivacyPolicy.POneHundred',
    defaultMessage: `If we sold or disclosed your personal information for a business
      purpose, two separate lists disclosing:`,
  },
  PAGRAPH_101: {
    id: 'PrivacyPolicy.POneHundredOne',
    defaultMessage: `sales, identifying the personal information categories that each
      category of recipient purchased; and`,
  },
  PAGRAPH_102: {
    id: 'PrivacyPolicy.POneHundredTwo',
    defaultMessage: `disclosures for a business purpose, identifying the personal
      information categories that each category of recipient obtained.`,
  },
  // PAGRAPH_103: {
  //   id: 'PrivacyPolicy.POneHundredThree',
  //   defaultMessage: `{strongDeletionRequest}`,
  // },
  PAGRAPH_104: {
    id: 'PrivacyPolicy.POneHundredFour',
    defaultMessage: `You have the right to request that we delete any of your personal
      information that we collected from you and retained, subject to certain
      exceptions. Once we receive and confirm your verifiable consumer request,
      we will delete (and direct our service providers to delete) your personal
      information from our records, unless an exception applies.`,
  },
  PAGRAPH_105: {
    id: 'PrivacyPolicy.POneHundredFive',
    defaultMessage: `We may deny your deletion request if retaining the information is necessary
      for us or our service provider(s) to:`,
  },
  PAGRAPH_106: {
    id: 'PrivacyPolicy.POneHundredSix',
    defaultMessage: `Complete the transaction for which the personal information was collected, 
    fulfill the terms of a written warranty or product recall conducted in accordance with federal law, 
    provide a good or service requested by the consumer, or reasonably anticipated by the consumer within the context of a business’ 
    ongoing business relationship with the consumer, or otherwise perform a contract between the business and the consumer.`,
  },
  PAGRAPH_107: {
    id: 'PrivacyPolicy.POneHundredSeven',
    defaultMessage: `Help to ensure security and integrity to the extent the use of the consumer’s 
    personal information is reasonably necessary and proportionate for those purposes.`,
  },
  PAGRAPH_108: {
    id: 'PrivacyPolicy.POneHundredEight',
    defaultMessage: `Debug products to identify and repair errors that impair existing
      intended functionality.`,
  },
  PAGRAPH_109: {
    id: 'PrivacyPolicy.POneHundredNine',
    defaultMessage: `Exercise free speech, ensure the right of another consumer to exercise
    at consumer’s” free speech rights, or exercise another right provided for by
      law.`,
  },
  PAGRAPH_110: {
    id: 'PrivacyPolicy.POneHundredTen',
    defaultMessage: `Comply with the California Electronic Communications Privacy Act pursuant to Chapter 3.6 (Cal.
        Penal Code § 1546 et. seq.).`,
  },
  PAGRAPH_111: {
    id: 'PrivacyPolicy.POneHundredEleven',
    defaultMessage: `Engage in public or peer-reviewed scientific, historical, or
      statistical research that conforms or adheres to all other
      applicable ethics and privacy laws ability to complete such, when the information’s deletion may
      likely render impossible or seriously impair the ability to complete such research, if you previously provided informed consent.`,
  },
  PAGRAPH_112: {
    id: 'PrivacyPolicy.POneHundredTwelve',
    defaultMessage: `Enable solely internal uses that are reasonably aligned with consumer
      expectations based on your relationship with us and compatible with the context in which you provided the information.`,
  },
  PAGRAPH_113: {
    id: 'PrivacyPolicy.POneHundredThirteen',
    defaultMessage: `Comply with a legal obligation.`,
  },
  // PAGRAPH_114: {
  //   id: 'PrivacyPolicy.POneHundredFourteen',
  //   defaultMessage: `Make other internal and lawful uses of that information that are
  //     compatible with the context in which you provided it.`,
  // },

  PAGRAPH_115: {
    id: 'PrivacyPolicy.POneHundredFifteen',
    defaultMessage: `{{StrongExcercisingRights}}`,
  },
  PAGRAPH_116: {
    id: 'PrivacyPolicy.POneHundredSixteen',
    defaultMessage: `To exercise the access, data portability, correction, and deletion rights described
      above, please submit a verifiable consumer request to us by sending us a
      message on our website. Only you, or a person registered with the
      California Secretary of State that you authorize to act on your behalf, may
      make a verifiable consumer request related to your personal information.
      You may also make a verifiable consumer request on behalf of your minor
      child.`,
  },
  PAGRAPH_117: {
    id: 'PrivacyPolicy.POneHundredSeventeen',
    defaultMessage: `You may only make a verifiable consumer request for access or data
      portability twice within a 12-month period. The verifiable consumer request
      must:`,
  },
  PAGRAPH_118: {
    id: 'PrivacyPolicy.POneHundredEighteen',
    defaultMessage: `Provide sufficient information that allows us to reasonably verify you
      are the person about whom we collected personal information or an
      authorized representative.`,
  },
  PAGRAPH_119: {
    id: 'PrivacyPolicy.POneHundredNineteen',
    defaultMessage: `Describe your request with sufficient detail that allows us to properly
      understand, evaluate, and respond to it.`,
  },
  PAGRAPH_120: {
    id: 'PrivacyPolicy.POneHundredTwenty',
    defaultMessage: `We cannot respond to your request or provide you with personal information
      if we cannot verify your identity or authority to make the request and
      confirm the personal information relates to you. We will only use personal
      information provided in a verifiable consumer request to verify the
      requestor’s identity or authority to make the request.`,
  },
  PAGRAPH_121: {
    id: 'PrivacyPolicy.POneHundredTwentyOne',
    defaultMessage: `{{strongResponseTiming}}`,
  },
  PAGRAPH_122: {
    id: 'PrivacyPolicy.POneHundredTwentyTwo',
    defaultMessage: `We endeavor to respond to a verifiable consumer request within forty-five
      (45) days of its receipt. If we require more time (up to 90 days), we will
      inform you of the reason and extension period in writing. We will deliver
      our written response by mail or electronically, at your option. Any
      disclosures we provide will only cover the 12-month period preceding the
      verifiable consumer request’s receipt. The response we provide will also
      explain the reasons we cannot comply with a request, if applicable. For
      data portability requests, we will select a format to provide your personal
      information that is readily useable and should allow you to transmit the
      information from one entity to another entity without hindrance,
      specifically by electronic mail communication.`,
  },
  PAGRAPH_123: {
    id: 'PrivacyPolicy.POneHundredTwentyThree',
    defaultMessage: `We do not charge a fee to process or respond to your verifiable consumer
      request unless it is excessive, repetitive, or manifestly unfounded. If we
      determine that the request warrants a fee, we will tell you why we made
      that decision and provide you with a cost estimate before completing your
      request.`,
  },
  PAGRAPH_124: {
    id: 'PrivacyPolicy.POneHundredTwentyFour',
    defaultMessage: `{{strongPersonalInformationSales}}`,
  },
  PAGRAPH_125: {
    id: 'PrivacyPolicy.POneHundredTwentyFive',
    defaultMessage: `If you are 16 years of age or older, you have the right to direct us to not
      sell your personal information at any time (the “right to opt-out”). We do
      not sell the personal information of consumers we actually know are less
      than 16 years of age, unless we receive affirmative authorization (the
      “right to opt-in”) from either the consumer who is between 13 and 16 years
      of age, or the parent or guardian of a consumer less than 13 years of age.
      Consumers who opt-in to personal information sales may opt-out of future
      sales at any time. To exercise the right to opt-out, you (or your
      authorized representative) may submit a request to us by visiting the
      following our webpage and sending us a message.`,
  },
  PAGRAPH_126: {
    id: 'PrivacyPolicy.POneHundredTwentySix',
    defaultMessage: `Once you make an opt-out request, we will wait at least twelve (12) months
      before asking you to reauthorize personal information sales. However, you
      may change your mind and opt back in to personal information sales at any
      time by visiting our website and sending us a message. We will only use
      personal information provided in an opt-out request to review and comply
      with the request.`,
  },
  PAGRAPH_127: {
    id: 'PrivacyPolicy.POneHundredTwentySeven',
    defaultMessage: `{{strongNonDiscrimination}}`,
  },
  PAGRAPH_128: {
    id: 'PrivacyPolicy.POneHundredTwentyEight',
    defaultMessage: `We will not discriminate against you for exercising any of your CCPA
      rights. Unless permitted by the CCPA, we will not:`,
  },
  PAGRAPH_129: {
    id: 'PrivacyPolicy.POneHundredTwentyNine',
    defaultMessage: `Deny you goods or services.`,
  },
  PAGRAPH_130: {
    id: 'PrivacyPolicy.POneHundredThirty',
    defaultMessage: `Deny you goods or services.Charge you different prices or rates for goods or services, including
      through granting discounts or other benefits, or imposing penalties.`,
  },
  PAGRAPH_131: {
    id: 'PrivacyPolicy.POneHundredThirtyOne',
    defaultMessage: `Provide you a different level or quality of goods or services.`,
  },
  PAGRAPH_132: {
    id: 'PrivacyPolicy.POneHundredThirtyTwo',
    defaultMessage: `Suggest that you may receive a different price or rate for goods or
      services or a different level or quality of goods or services.`,
  },
  PAGRAPH_133: {
    id: 'PrivacyPolicy.POneHundredThirtyThree',
    defaultMessage: `However, we may offer you certain financial incentives permitted by the
      CCPA that can result in different prices, rates, or quality levels. Any
      CCPA-permitted financial incentive we offer will reasonably relate to your
      personal information’s value and contain written terms that describe the
      program’s material aspects. Participation in a financial incentive program
      requires your prior opt in consent, which you may revoke at any time.`,
  },
  PAGRAPH_134: {
    id: 'PrivacyPolicy.POneHundredThirtyFour',
    defaultMessage: `California’s “Shine the Light” law (Civil Code Section § 1798.83) permits
      users of our Website that are California residents to request certain
      information regarding our disclosure of personal information to third
      parties for their direct marketing purposes. To make such a request, please
      send us an electronic message through our website or write us at the
      address listed on our webpage.`,
  },
  PAGRAPH_135: {
    id: 'PrivacyPolicy.POneHundredThirtyFive',
    defaultMessage: `{{StrongCorrectionRequestRights}}`,
  },
  PAGRAPH_136: {
    id: 'PrivacyPolicy.POneHundredThirtySix',
    defaultMessage: `You have the right to request that we correct inaccurate information that we have about you. 
    We provide multiple ways to contact us as described in Section 12 of this Privacy Policy`,
  },
  PAGRAPH_137: {
    id: 'PrivacyPolicy.POneHundredThirtySeven',
    defaultMessage: `{{StrongLimitUseRequestRights}}`,
  },
  PAGRAPH_138: {
    id: 'PrivacyPolicy.POneHundredThirtyEight',
    defaultMessage: `You have the right to request that we limit the use and disclosure of sensitive personal information (as defined in the CCPA, 
      as amended) that we collect from you to the extent that such sensitive information is used for the purpose of inferring characteristics about you`,
  },

  // strong ones:
  STRONG_ZIPONGO: {
    id: 'PrivacyPolicy.StrongZipongo',
    defaultMessage: 'Zipongo',
  },
  STRONG_WE: {
    id: 'PrivacyPolicy.StrongWe',
    defaultMessage: 'we',
  },
  STRONG_US: {
    id: 'PrivacyPolicy.StrongUs',
    defaultMessage: 'us',
  },
  STRONG_TERMS_AND_CONDITIONS: {
    id: 'PrivacyPolicy.StrongTermsAndConditions',
    defaultMessage: 'Terms and Conditions',
  },
  STRONG_SITE: {
    id: 'PrivacyPolicy.StrongSite',
    defaultMessage: 'Site',
  },
  STRONG_SERVICE: {
    id: 'PrivacyPolicy.StrongService',
    defaultMessage: 'Service',
  },
  STRONG_END_USER: {
    id: 'PrivacyPolicy.StrongEndUser',
    defaultMessage: 'End User',
  },
  STRONG_SEPARATELY: {
    id: 'PrivacyPolicy.StrongSeparately',
    defaultMessage: 'separately',
  },
  STRONG_Terms_OF_SERVICE: {
    id: 'PrivacyPolicy.StrongTermsOfService',
    defaultMessage: 'Terms of Service',
  },
  STRONG_PERSONAL_DATA: {
    id: 'PrivacyPolicy.StrongPersonalData',
    defaultMessage: `Personal Data`,
  },
  STRONG_ANON_DATA: {
    id: 'PrivacyPolicy.StrongAnonData',
    defaultMessage: `Anonymous Data`,
  },
  STRONG_USER_MESSAGES: {
    id: 'PrivacyPolicy.StrongUserMessages',
    defaultMessage: `User Messages`,
  },
  STRONG_FLASH_MANAGEMENT_TOOLS: {
    id: 'PrivacyPolicy.StrongFlashManagementTools',
    defaultMessage: `Flash management tools`,
  },
  STRONG_PUBLIC_CONTENT: {
    id: 'PrivacyPolicy.StrongPublicContent',
    defaultMessage: 'Public Content',
  },
  STRONG_PUBLIC_AREAS: {
    id: 'PrivacyPolicy.StrongPublicAreas',
    defaultMessage: 'Public Areas',
  },
  STRONG_SHARED_CONTENT: {
    id: 'PrivacyPolicy.StrongSharedContent',
    defaultMessage: 'Shared Content',
  },
  STRONG_THIRD_PARTY_SERVICES: {
    id: 'PrivacyPolicy.StrongThirdPartyServices',
    defaultMessage: 'Third-Party Services',
  },
  STRONG_THIRD_AFFILIATES: {
    id: 'PrivacyPolicy.StrongAffiliates',
    defaultMessage: 'Affiliates',
  },
  STRONG_PRIVACY_NOTICE_FOR_CA_RESIDENTS: {
    id: 'PrivacyPolicy.StrongPrivacyNoticeForCAREsidents',
    defaultMessage: 'Privacy Notice for California Residents',
  },
  STRONG_EFFECTIVE_DATE: {
    id: 'PrivacyPolicy.StrongEffectiveDate',
    defaultMessage: 'Effective Date',
  },
  STRONG_LAST_REVIEWD_ON: {
    id: 'PrivacyPolicy.StrongLastReviewedOn',
    defaultMessage: 'Last Reviewed',
  },
  STRONG_INFORMATION_WE_COLLECT: {
    id: 'PrivacyPolicy.StrongInformationWeCollect',
    defaultMessage: 'Information We Collect',
  },
  STRONG_PERSONAL_INFORMATION: {
    id: 'PrivacyPolicy.StrongPersonalInformation',
    defaultMessage: 'Personal information',
  },
  STRONG_CATEGORY_A: {
    id: 'PrivacyPolicy.StrongCategoryA',
    defaultMessage: 'Category A:',
  },
  STRONG_EXAMPLES: {
    id: 'PrivacyPolicy.StrongExamples',
    defaultMessage: 'Examples:',
  },
  STRONG_COLLECTED: {
    id: 'PrivacyPolicy.StrongCollected',
    defaultMessage: 'Collected:',
  },
  STRONG_CATEGORY_B: {
    id: 'PrivacyPolicy.StrongCategoryB',
    defaultMessage: 'Category B:',
  },
  STRONG_CATEGORY_C: {
    id: 'PrivacyPolicy.StrongCategoryC',
    defaultMessage: 'Category C:',
  },
  // heading and short phrases in <strong>
  STRONG_HEADING_1: {
    id: 'PrivacyPolicy.StrongHeadingOne',
    defaultMessage: '1. Types of Data We Collect',
  },
  STRONG_HEADING_1_1: {
    id: 'PrivacyPolicy.Strong.HeadingOneOne',
    defaultMessage: '1.1 Data You Provide to Us',
  },
  STRONG_HEADING_1_2: {
    id: 'PrivacyPolicy.Strong.HeadingOneTwo',
    defaultMessage: '1.2 Data Collected Through Technology',
  },
  STRONG_HEADING_2: {
    id: 'PrivacyPolicy.StrongHeadingTwo',
    defaultMessage: '2. Public Areas; Sharing',
  },
  STRONG_HEADING_3: {
    id: 'PrivacyPolicy.StrongHeadingThree',
    defaultMessage: '3. Third-Party Services',
  },
  STRONG_HEADING_4: {
    id: 'PrivacyPolicy.StrongHeadingFour',
    defaultMessage: '4. Use of Your Data',
  },
  STRONG_HEADING_4_1: {
    id: 'PrivacyPolicy.StrongHeadingFourOne',
    defaultMessage: '4.1 Generally',
  },
  STRONG_HEADING_4_2: {
    id: 'PrivacyPolicy.StrongHeadingFourTwo',
    defaultMessage: '4.2 Change of Control',
  },
  STRONG_HEADING_5: {
    id: 'PrivacyPolicy.StrongHeadingFive',
    defaultMessage: '5. Disclosure of Your Data',
  },
  STRONG_HEADING_5_1: {
    id: 'PrivacyPolicy.StrongHeadingFiveOne',
    defaultMessage: `5.1 Except as described below, we do not share your Personal Data with
        third parties:`,
  },
  STRONG_HEADING_5_2: {
    id: 'PrivacyPolicy.StrongHeadingFiveTwo',
    defaultMessage: `5.2 Information that You Share`,
  },
  STRONG_HEADING_6: {
    id: 'PrivacyPolicy.StrongHeadingSix',
    defaultMessage: `6. Use and Disclosure of Anonymous Data`,
  },
  STRONG_HEADING_7: {
    id: 'PrivacyPolicy.StrongHeadingSeven',
    defaultMessage: `7. Your Choices Regarding Your Personal Data`,
  },
  STRONG_HEADING_7_1: {
    id: 'PrivacyPolicy.StrongHeadingSevenOne',
    defaultMessage: `7.1 Your Control of the Use and Disclosure of Your Personal Data`,
  },
  STRONG_HEADING_7_2: {
    id: 'PrivacyPolicy.StrongHeadingSevenTwo',
    defaultMessage: `7.2 Changes to Personal Data`,
  },
  STRONG_HEADING_8: {
    id: 'PrivacyPolicy.StrongHeadingEight',
    defaultMessage: `8. A Note about Children`,
  },
  STRONG_HEADING_9: {
    id: 'PrivacyPolicy.StrongHeadingNine',
    defaultMessage: `9. Security`,
  },
  STRONG_HEADING_10: {
    id: 'PrivacyPolicy.StrongHeadingTen',
    defaultMessage: `10. Changes to this Enterprise Privacy Policy`,
  },
  STRONG_HEADING_11: {
    id: 'PrivacyPolicy.StrongHeadingEleven',
    defaultMessage: `11. Compliance with laws: CCPA, GDPR`,
  },
  STRONG_HEADING_11_1: {
    id: 'PrivacyPolicy.StrongHeadingElevenOne',
    defaultMessage: `11.1 Your California Privacy Rights`,
  },
  STRONG_HEADING_11_2: {
    id: 'PrivacyPolicy.StrongHeadingElevenTwo',
    defaultMessage: `11.2 Notice to European Users`,
  },
  STRONG_HEADING_12: {
    id: 'PrivacyPolicy.StrongHeadingTwelve',
    defaultMessage: `12. Contacting Zipongo`,
  },
  // strong long phrases:
  STRONG_USE_OF_PERSONAL_INFO: {
    id: 'PrivacyPolicy.StrongUseOfPersonalInfo',
    defaultMessage: `Use of Personal Information`,
  },
  STRONG_SHARING_PERSONAL_INFO: {
    id: 'PrivacyPolicy.StrongSharingPersonalInfo',
    defaultMessage: `Sharing Personal Information`,
  },
  STRONG_DISCLOUSURE_OF_PERSONAL_INFO: {
    id: 'PrivacyPolicy.StrongDisclosuresOfPersonalInfo',
    defaultMessage: `Disclosures of Personal Information for a Business Purpose`,
  },
  STRONG_SALE_OF_PERSONAL_INFO: {
    id: 'PrivacyPolicy.StrongSaleOfPersonalInfo',
    defaultMessage: `Sales of Personal Information`,
  },
  STRONG_YOUR_RIGHTS_AND_CHOICES: {
    id: 'PrivacyPolicy.StrongYourRightsAndChoices',
    defaultMessage: `Your Rights and Choices`,
  },
  STRONG_ACCESS_SPECIFIC_INFO: {
    id: 'PrivacyPolicy.StrongAccessSpecificInfo',
    defaultMessage: `Access to Specific Information and Data Portability Rights`,
  },
  STRONG_DELETION_REQUEST_RIGHTS: {
    id: 'PrivacyPolicy.StrongDeletionRequestRights',
    defaultMessage: `Deletion Request Rights`,
  },
  STRONG_EXCERCISING_RIGHTS: {
    id: 'PrivacyPolicy.StrongExcercisingRights',
    defaultMessage: `Exercising Access, Data Portability, Correction Rights, and Deletion Rights`,
  },
  STRONG_RESPONSE_TIME_AND_FORMAT: {
    id: 'PrivacyPolicy.StrongResponseTimingAndFormat',
    defaultMessage: `Response Timing and Format`,
  },
  STRONG_PERSONAL_INFO_SALES_OPT: {
    id: 'PrivacyPolicy.StrongPersonalInfoSalesOpt',
    defaultMessage: `Personal Information Sales Opt-Out and Opt-In Rights`,
  },
  STRONG_NON_DESCRIMINATION: {
    id: 'PrivacyPolicy.StrongNonDiscrimination',
    defaultMessage: `Non-Discrimination`,
  },
  STRONG_CORRECTREQUESTRIGHTS: {
    id: 'PrivacyPolicy.StrongCorrectionRequestRights',
    defaultMessage: `Correction Request Rights`,
  },
  STRONG_LIMITREQRIGHTS: {
    id: 'PrivacyPolicy.StrongLimitUseRequestRights',
    defaultMessage: `Limit Use Request Rights`,
  },
};

// Imported from google doc via conversion to docx, then processed through https://word2cleanhtml.com/
export default function Privacy() {
  const values = { htmlBR: `<br />` };
  const { t } = useTranslation();
  return (
    <LegalWrapper currentTab="privacy-policy">
      <div>
        <div>
          <h1>
            <FormattedMessage {...I18N_MESSAGES.HEADING_NORMAL} />
          </h1>
          <h3>
            <FormattedMessage {...I18N_MESSAGES.HEADING_SMALL} />
          </h3>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_1} />
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_2} />
          </p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_3} />
            </strong>
          </p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_HEADING_1} />
            </strong>
          </p>
          <p>
            <FormattedMessage
              {...I18N_MESSAGES.PAGRAPH_4}
              values={{
                strongPersonalData: t(
                  I18N_MESSAGES.STRONG_PERSONAL_DATA.id,
                  I18N_MESSAGES.STRONG_PERSONAL_DATA.defaultMessage,
                ),
                strongAnonymousData: t(
                  I18N_MESSAGES.STRONG_ANON_DATA.id,
                  I18N_MESSAGES.STRONG_ANON_DATA.defaultMessage,
                ),
              }}
            />
          </p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_HEADING_1_1} />
            </strong>
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_5} />
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_6} />
          </p>
          {/* <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_7} />
          </p> */}
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_8} />
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_8_5} />
          </p>
          <p>
            <FormattedMessage
              {...I18N_MESSAGES.PAGRAPH_9}
              values={{
                strongUserMessages: t(
                  I18N_MESSAGES.STRONG_USER_MESSAGES.id,
                  I18N_MESSAGES.STRONG_USER_MESSAGES.defaultMessage,
                ),
              }}
            />
          </p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_HEADING_1_2} />
            </strong>
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_10} />
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_11} />
          </p>
          <p>
            <FormattedMessage
              {...I18N_MESSAGES.PAGRAPH_12}
              values={{
                flashManagementToolsLink: t(
                  I18N_MESSAGES.STRONG_FLASH_MANAGEMENT_TOOLS.id,
                  I18N_MESSAGES.STRONG_FLASH_MANAGEMENT_TOOLS.defaultMessage,
                ),
              }}
            />
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_13} />
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_14} />
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_15} />
          </p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_HEADING_2} />
            </strong>
          </p>
          <p>
            <FormattedMessage
              {...I18N_MESSAGES.PAGRAPH_16}
              values={{
                strongPublicContent: `<strong>${t(
                  I18N_MESSAGES.STRONG_PUBLIC_CONTENT.id,
                  I18N_MESSAGES.STRONG_PUBLIC_CONTENT.defaultMessage,
                )}</strong>`,
                strongPublicAreas: `<strong>${t(
                  I18N_MESSAGES.STRONG_PUBLIC_AREAS.id,
                  I18N_MESSAGES.STRONG_PUBLIC_AREAS.defaultMessage,
                )}</strong>`,
                strongSharedContent: `<strong>${t(
                  I18N_MESSAGES.STRONG_SHARED_CONTENT.id,
                  I18N_MESSAGES.STRONG_SHARED_CONTENT.defaultMessage,
                )}</strong>`,
              }}
            />
          </p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_HEADING_3} />
            </strong>
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_17} />
          </p>
          <p>
            <FormattedMessage
              {...I18N_MESSAGES.PAGRAPH_18}
              values={{
                strongThirdPartyServices: `<strong>
                    ${t(
                      I18N_MESSAGES.STRONG_THIRD_PARTY_SERVICES.id,
                      I18N_MESSAGES.STRONG_THIRD_PARTY_SERVICES.defaultMessage,
                    )}
                  </strong>`,
              }}
            />
          </p>
          <p>
            <FormattedMessage
              {...I18N_MESSAGES.PAGRAPH_19}
              values={{
                strongUserOfYourData: `<strong>
                    ${t(
                      I18N_MESSAGES.STRONG_HEADING_4.id,
                      I18N_MESSAGES.STRONG_HEADING_4.defaultMessage,
                    )}
                  </strong>`,
              }}
            />
          </p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_HEADING_4_1} />
            </strong>
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_20} />
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_21} />
          </p>
          <ul>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_22} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_23} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_24} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_25} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_26} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_27} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_28} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_29} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_30} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_31} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_32} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_33} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_34} />
            </li>
          </ul>
          <p><FormattedMessage {...I18N_MESSAGES.PARAGRAPH_34_ammend}/></p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_HEADING_4_2} />
            </strong>
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_35} />
          </p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_HEADING_5} />
            </strong>
          </p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_HEADING_5_1} />
            </strong>
          </p>
          <ul>
            <li>
              <FormattedMessage
                {...I18N_MESSAGES.PAGRAPH_36}
                values={{
                  stripeLink: `<a href="http://stripe.com/us/privacy">http://stripe.com/us/privacy</a>`,
                  paypalLink: `<a href="https://www.paypal.com/us/webapps/mpp/ua/privacy-full">
                    https://www.paypal.com/us/webapps/mpp/ua/privacy-full
                  </a>`,
                }}
              />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_37} />
            </li>
            <li>
              <FormattedMessage
                {...I18N_MESSAGES.PAGRAPH_38}
                values={{
                  strongAffiliates: t(
                    I18N_MESSAGES.STRONG_THIRD_AFFILIATES.id,
                    I18N_MESSAGES.STRONG_THIRD_AFFILIATES.defaultMessage,
                  ),
                }}
              />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_39} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_40} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_41} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_42} />
            </li>
          </ul>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_HEADING_5_2} />
            </strong>
          </p>
          <p>
            <FormattedMessage
              {...I18N_MESSAGES.PAGRAPH_43}
              values={{
                foodsmartTermsAndConditionsLink: `<a href="https://foodsmart.co/terms/">Foodsmart Terms and Conditions</a>`,
              }}
            />
          </p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_HEADING_6} />
            </strong>
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_44} />
          </p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_HEADING_7} />
            </strong>
          </p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_HEADING_7_1} />
            </strong>
          </p>
          <p>
            <FormattedMessage
              {...I18N_MESSAGES.PAGRAPH_45}
              values={{
                strongSupportEmail: `<strong>support@foodsmart.com</strong>`,
              }}
            />
          </p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_HEADING_7_2} />
            </strong>
          </p>
          <p>
            <FormattedMessage
              {...I18N_MESSAGES.PAGRAPH_46}
              values={{
                strongSupportEmail: `<strong>support@foodsmart.com</strong>`,
              }}
            />
          </p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_HEADING_8} />
            </strong>
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_47} />
          </p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_HEADING_9} />
            </strong>
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_48} />
          </p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_HEADING_10} />
            </strong>
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_49} />
          </p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_HEADING_11} />
            </strong>
          </p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_HEADING_11_1} />
            </strong>
          </p>
          <p>
            <FormattedMessage
              {...I18N_MESSAGES.PAGRAPH_50}
              values={{
                oagLink: `<a href="https://oag.ca.gov/privacy/ccpa">
                    https://oag.ca.gov/privacy/ccpa
                  </a>`,
              }}
            />
          </p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_HEADING_11_2} />
            </strong>
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_51} />
          </p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_HEADING_12} />
            </strong>
          </p>
          <p>
            <FormattedMessage
              {...I18N_MESSAGES.PAGRAPH_52}
              values={{
                strongSupportEmail: `<strong>support@foodsmart.com </strong>`,
              }}
            />
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_53} values={values} />
          </p>
          <p>
            <strong></strong>
          </p>
          <h2>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_54} />
            </strong>
          </h2>
          <p>
            <FormattedMessage
              {...I18N_MESSAGES.PAGRAPH_55}
              values={{
                strongEffectiveDate: t(
                  I18N_MESSAGES.STRONG_EFFECTIVE_DATE.id,
                  I18N_MESSAGES.STRONG_EFFECTIVE_DATE.defaultMessage,
                ),
              }}
            />
          </p>
          <p>
            <FormattedMessage
              {...I18N_MESSAGES.PAGRAPH_56}
              values={{
                strongLastReviewedOn: t(
                  I18N_MESSAGES.STRONG_LAST_REVIEWD_ON.id,
                  I18N_MESSAGES.STRONG_LAST_REVIEWD_ON.defaultMessage,
                ),
              }}
            />
          </p>
          <p>
            <FormattedMessage
              {...I18N_MESSAGES.PAGRAPH_57}
              values={{
                strongPrivacyNoticeForCaliforniaResidents: t(
                  I18N_MESSAGES.STRONG_PRIVACY_NOTICE_FOR_CA_RESIDENTS.id,
                  I18N_MESSAGES.STRONG_PRIVACY_NOTICE_FOR_CA_RESIDENTS.defaultMessage,
                ),
              }}
            />
          </p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_INFORMATION_WE_COLLECT} />
            </strong>
          </p>
          <p>
            <FormattedMessage
              {...I18N_MESSAGES.PAGRAPH_59}
              values={{
                strongPersonalInformation: `<strong>${t(
                  I18N_MESSAGES.STRONG_PERSONAL_INFORMATION.id,
                  I18N_MESSAGES.STRONG_PERSONAL_INFORMATION.defaultMessage,
                )}</strong>`,
              }}
            />
          </p>
          <p>
            <FormattedMessage
              {...I18N_MESSAGES.PAGRAPH_60}
              values={{
                strongCategoryA: `<strong>
                   ${t(
                     I18N_MESSAGES.STRONG_CATEGORY_A.id,
                     I18N_MESSAGES.STRONG_CATEGORY_A.defaultMessage,
                   )}
                  </strong>`,
              }}
            />
          </p>
          <p>
            <FormattedMessage
              {...I18N_MESSAGES.PAGRAPH_61}
              values={{
                strongExamples: `<strong>
                    ${t(
                      I18N_MESSAGES.STRONG_EXAMPLES.id,
                      I18N_MESSAGES.STRONG_EXAMPLES.defaultMessage,
                    )}
                  </strong>`,
              }}
            />
          </p>
          <p>
            <FormattedMessage
              {...I18N_MESSAGES.PAGRAPH_62}
              values={{
                strongCollected: `<strong>
                    ${t(
                      I18N_MESSAGES.STRONG_COLLECTED.id,
                      I18N_MESSAGES.STRONG_COLLECTED.defaultMessage,
                    )}
                  </strong>`,
              }}
            />
          </p>
          <p>
            <FormattedMessage
              {...I18N_MESSAGES.PAGRAPH_63}
              values={{
                strongCategoryB: `<strong>
                    ${t(
                      I18N_MESSAGES.STRONG_CATEGORY_B.id,
                      I18N_MESSAGES.STRONG_CATEGORY_B.defaultMessage,
                    )}
                  </strong>`,
              }}
            />
          </p>
          <p>
            <FormattedMessage
              {...I18N_MESSAGES.PAGRAPH_64}
              values={{
                strongExamples: `<strong>
                    ${t(
                      I18N_MESSAGES.STRONG_EXAMPLES.id,
                      I18N_MESSAGES.STRONG_EXAMPLES.defaultMessage,
                    )}
                  </strong>`,
              }}
            />
          </p>
          <p>
            <FormattedMessage
              {...I18N_MESSAGES.PAGRAPH_65}
              values={{
                strongCollected: `<strong>
                    ${t(
                      I18N_MESSAGES.STRONG_COLLECTED.id,
                      I18N_MESSAGES.STRONG_COLLECTED.defaultMessage,
                    )}
                  </strong>`,
              }}
            />
          </p>
          <p>
            <FormattedMessage
              {...I18N_MESSAGES.PAGRAPH_66}
              values={{
                strongCategoryC: `<strong>
                    ${t(
                      I18N_MESSAGES.STRONG_CATEGORY_C.id,
                      I18N_MESSAGES.STRONG_CATEGORY_C.defaultMessage,
                    )}
                  </strong>`,
              }}
            />
          </p>
          <p>
            <FormattedMessage
              {...I18N_MESSAGES.PAGRAPH_67}
              values={{
                strongExamples: `<strong>
                    ${t(
                      I18N_MESSAGES.STRONG_EXAMPLES.id,
                      I18N_MESSAGES.STRONG_EXAMPLES.defaultMessage,
                    )}
                  </strong>`,
              }}
            />
          </p>
          <p>
            <FormattedMessage
              {...I18N_MESSAGES.PAGRAPH_68}
              values={{
                strongCollected: `<strong>
                   ${t(
                     I18N_MESSAGES.STRONG_COLLECTED.id,
                     I18N_MESSAGES.STRONG_COLLECTED.defaultMessage,
                   )}
                  </strong>`,
              }}
            />
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_69} />
          </p>
          <ul>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_70} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_71} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_72} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_73} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_74} />
            </li>
          </ul>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_75} />
          </p>
          <ul>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_76} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_77} />
            </li>
          </ul>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_USE_OF_PERSONAL_INFO} />
            </strong>
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_79} />
          </p>
          <ul>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_80} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_81} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_82} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_83} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_84} />
            </li>
          </ul>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_SHARING_PERSONAL_INFO} />
            </strong>
          </p>
          <p>
            <FormattedMessage
              {...I18N_MESSAGES.PAGRAPH_86}
              values={{
                personalInformationSalesLink: `<a href="https://www.nva.com/privacy-policy">
                    Personal Information Sales Opt-Out and Opt-In Rights
                  </a>`,
              }}
            />
          </p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_DISCLOUSURE_OF_PERSONAL_INFO} />
            </strong>
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_88} />
          </p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_SALE_OF_PERSONAL_INFO} />
            </strong>
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_90} />
          </p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_YOUR_RIGHTS_AND_CHOICES} />
            </strong>
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_92} />
          </p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_ACCESS_SPECIFIC_INFO} />
            </strong>
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_94} />
          </p>
          <ul>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_95} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_96} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_97} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_98} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_99} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_100} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_101} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_102} />
            </li>
          </ul>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_DELETION_REQUEST_RIGHTS} />
            </strong>
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_104} />
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_105} />
          </p>
          <ul>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_106} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_107} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_108} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_109} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_110} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_111} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_112} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_113} />
            </li>
            {/* <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_114} />
            </li> */}
          </ul>
          <p>
          <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_CORRECTREQUESTRIGHTS} />
          </strong>
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_136} />
          </p>
          <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_LIMITREQRIGHTS} />
          </strong>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_138} />
          </p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_EXCERCISING_RIGHTS} />
            </strong>
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_116} />
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_117} />
          </p>
          <ul>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_118} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_119} />
            </li>
          </ul>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_120} />
          </p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_RESPONSE_TIME_AND_FORMAT} />
            </strong>
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_122} />
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_123} />
          </p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_PERSONAL_INFO_SALES_OPT} />
            </strong>
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_125} />
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_126} />
          </p>
          <p>
            <strong>
              <FormattedMessage {...I18N_MESSAGES.STRONG_NON_DESCRIMINATION} />
            </strong>
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_128} />
          </p>
          <ul>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_129} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_130} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_131} />
            </li>
            <li>
              <FormattedMessage {...I18N_MESSAGES.PAGRAPH_132} />
            </li>
          </ul>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_133} />
          </p>
          <p>
            <FormattedMessage {...I18N_MESSAGES.PAGRAPH_134} />
          </p>
        </div>
      </div>
    </LegalWrapper>
  );
}
