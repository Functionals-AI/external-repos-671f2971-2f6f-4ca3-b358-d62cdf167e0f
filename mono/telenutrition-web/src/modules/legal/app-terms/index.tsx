import React from 'react';
import FormattedMessage from '../../../components/formatted-message';
import LegalWrapper from '../legal-wrapper';

const I18N_MESSAGES = {
  HEADING_NORMAL: {
    id: 'Terms.Heading.Normal',
    defaultMessage: 'Terms of Service',
  },
  HEADING_SMALL: {
    id: 'Terms.Heading.Small',
    defaultMessage: 'Acceptance of Terms and Conditions',
  },
  MAIN_PARAGRAPH: {
    id: 'Terms.MainParagraph',
    defaultMessage: `Foodsmart is a business name of Zipongo, Inc., 
    and any references herein to Foodsmart also refer to Zipongo. 
    Zipongo, Inc. and its service Foodsmart are herein referred to as “Foodsmart,” “we,” or “us”. 
    By using the Foodsmart website at www.Foodsmart.com ("Site") and/or the Foodsmart services made available for use with your mobile device, 
    including mobile apps, including but not limited to OrderWell, or through the Site ("Service"), 
    you ("you" or the "End User") agree to these terms and conditions (the "Terms of Service" or "Agreement") that we have provided herein.`,
  },
  LINE_I_HEADING: {
    id: 'Terms.Line.I.Heading',
    defaultMessage: 'I. Terms of Service',
  },
  LINE_I_BODY: {
    id: 'Terms.Line.I.Body',
    defaultMessage: `These Terms of Service govern your access to and use of the Site 
    and Service provided by Foodsmart. PLEASE READ THIS AGREEMENT CAREFULLY. BY ACCESSING OR USING THE SERVICE OR SITE, 
    YOU REPRESENT AND WARRANT THAT YOU ARE AT LEAST 13 YEARS OF AGE AND YOU AGREE TO BE BOUND BY THIS AGREEMENT. 
    IF YOU DO NOT WISH TO BE BOUND BY THIS AGREEMENT OR YOU ARE UNDER 13 YEARS OF AGE, YOU MAY NOT ACCESS OR USE THE SERVICE OR SITE. 
    Certain features of the Service or Site may be subject to additional guidelines, terms, or rules, which will be posted on the 
    Service or Site in connection with such features. All such additional terms and the Foodsmart Privacy Policy ("Privacy Policy") 
    are incorporated by reference into this Agreement. Capitalized terms not defined in the body of this Agreement will have the 
    meanings set forth in the Privacy Policy. The Foodsmart mobile application is licensed to you under the respective mobile terms of the 
    Licensed Application End User License Agreement, your terms of use of the application is governed by the mobile terms and conditions, 
    which are incorporated by reference into these Terms of Service. In the event of a conflict or inconsistency between the terms 
    of the Licensed Application End User License Agreement and the terms of this Agreement, the terms of this Agreement will 
    take precedence and govern.`,
  },
  LINE_1_HEADING: {
    id: 'Terms.LineOne.Heading',
    defaultMessage: '1. Disclaimer',
  },
  LINE_1_BODY: {
    id: 'Terms.LineOne.Body',
    defaultMessage: `FOODSMART PROVIDES ALL INFORMATION ON THE SERVICE AND SITE, INCLUDING NUTRITION INFORMATION, FITNESS INFORMATION, 
    AND INFORMATION RELATING TO MEDICAL AND HEALTH CONDITIONS, FOR INFORMATIONAL AND EDUCATIONAL PURPOSES ONLY AND NOT AS MEDICAL ADVICE. 
    FOODSMART DOES NOT ASSUME ANY LIABILITY FOR INACCURACIES, OMISSIONS OR MISSTATEMENTS RELATING TO SUCH INFORMATION. INFORMATION ON THE 
    SERVICE AND SITE IS NOT INTENDED AS A SUBSTITUTE FOR THE ADVICE PROVIDED BY A HEALTHCARE PROFESSIONAL. YOU SHOULD NOT USE SUCH INFORMATION 
    AS MEDICAL ADVICE OR FOR THE DIAGNOSIS OR TREATMENT OF A HEALTH PROBLEM, DISEASE, OR OTHER MEDICAL CONDITION. ALWAYS CONSULT A HEALTHCARE 
    PROFESSIONAL BEFORE MAKING ANY CHANGES TO YOUR DIET OR EXERCISE REGIMEN.
    FOODSMART DOES NOT PROVIDE DELIVERY SERVICES OR FOOD PREPARATION. EACH FOOD SERVICE PROVIDER OFFERS DELIVERY SERVICES 
    THROUGH USE OF THE SERVICE. FOODSMART OFFERS INFORMATION AND A METHOD TO ON-DEMAND MEAL DELIVERY, BUT DOES NOT, AND DOES NOT INTEND TO, 
    PROVIDE COURIER SERVICES OR DELIVERY SERVICES, OR ACT IN ANY WAY AS A COURIER, AND HAS NO RESPONSIBILITY OR LIABILITY FOR ANY COURIER. 
    Unless expressly stated otherwise on OrderWell or Foodsmart, the food featured on the Service is offered, provided, sold, and delivered 
    by the Food Service Provider, not Foodsmart. We are in no way responsible for the quality of food or services offered by any 
    Food Service Provider. FOODSMART DOES NOT AND DOES NOT INTEND TO PREPARE FOOD, OR ACT AS A FOOD PREPARATION ENTITY AND HAS NO RESPONSIBILITY 
    OR LIABILITY FOR ANY PREPARED FOOD.
    YOU AGREE THAT WHEN A FOODSMART AGENT PERFORMS ON YOUR BEHALF, YOU ARE RESPONSIBLE FOR ANY PURCHASES, FEES, 
    SHIPPING AND HANDLING COSTS THAT MAY APPLY FOR ANY AUTHORIZED PURCHASES COMPLETED BY THE FOODSMART AGENT. 
    YOU AGREE THAT FOODSMART IS NOT RESPONSIBLE FOR KNOWING OR NOTIFYING ANYONE OF ANY FOOD ALLERGIES OR FOOD SENSITIVITIES THAT YOU MAY HAVE. 
    THERE IS NO COST OF SERVICE TO YOU FOR USING A FOODSMART AGENT TO COMPLETE PURCHASES ON YOUR BEHALF.`,
  },
  LINE_2_HEADING: {
    id: 'Terms.LineTwo.Heading',
    defaultMessage: '2. User Accounts',
  },
  LINE_2_BODY: {
    id: 'Terms.LineTwo.Body',
    defaultMessage: `To use the Service, you must create a user account ("Account"). You may link this Account to your account 
    with a third party service ("Third Party Account"), such as Google or an employer provided SSO connection, 
    in which case we will import your profile information from your Third Party Account to help create your Account and to enable you, if available, 
    to login to the Service using your Third Party Account login credentials. We may require you to enter additional 
    information to complete the creation of your Account. Your Third Party Account is provided by the applicable third party service, 
    not us, and subject to that third party service’s separate terms and conditions. 
    You will promptly update all Account information to keep it true, accurate, and complete. 
    You will be responsible for all activities that occur under your Account, username, and password and therefore 
    you agree to keep your password confidential. You agree that when you elect to use a Foodsmart agent to act on your behalf, 
    that each affirmative request by you is an authorization to use your Account, including any Account preparation or follow-up that 
    is required to complete the requested task. You agree to notify us immediately of any unauthorized use of your username or password 
    or if you believe that your password is no longer confidential. We reserve the right to require you to alter your username and/or 
    password if we believe that your Account is no longer secure. You will not: (a) provide any false personal information as part of 
    your Account information or in connection with the Service or Site; (b) create an Account for anyone other than yourself; 
    (c) create or use more than one Account at any given time; (d) transfer your Account to anyone else; 
    (e) permit others to use your Account; (f) use or access other persons’ Accounts; or (g) create an Account for any individual who is under the age of 13. 
    You agree that all details you provide to us for the purpose of ordering or purchasing products or services on your behalf are correct, 
    that the Payment Details you are using is your own, and that there are sufficient funds to cover the cost of the product or the service. 
    You further agree that by creating an Account, you authorized Foodsmart to market directly to you regarding Foodsmart Services, 
    and other third party products and services.`,
  },
  LINE_3_HEADING: {
    id: 'Terms.LineThree.Heading',
    defaultMessage: '3. User Content',
  },
  LINE_3_DOT_1_HEADING: {
    id: 'Terms.LineThree.One.Heading',
    defaultMessage: '3.1 License',
  },
  LINE_3_DOT_1_BODY: {
    id: 'Terms.LineThree.One.Body',
    defaultMessage: `You hereby grant Foodsmart an irrevocable, non-exclusive, royalty-free and fully paid, worldwide, transferable license, with the right 
    to sublicense through multiple tiers, to reproduce, distribute, modify, publicly display, publicly perform, prepare derivative works of, transmit, 
    and otherwise use (a) your Public Content in any manner and for any purpose and (b) your User Content for the purposes of providing you 
    and other users the Service. "User Content" means any and all submissions, assessments, contest entries, other entries and other content 
    and information that a user submits to, posts on, or makes available to the Service, but excluding Public Content. "Public Content" means any 
    and all messages, comments, recipe and meal ratings, and other content and information that a user submits to, posts on, or makes available to the Public Areas. 
    User Content and Public Content sometimes are referred to herein together as "Content". You represent and warrant that: (a) you have the right to grant the 
    foregoing license and to post and submit the User Content and Public Content; and (b) the User Content and Public Content will not infringe, misappropriate, 
    or violate any third party rights (including any intellectual property rights). You are solely responsible for your User Content and Public Content.`,
  },
  LINE_3_DOT_2_HEADING: {
    id: 'Terms.LineThree.Two.Heading',
    defaultMessage: '3.2 User Guidelines',
  },
  LINE_3_DOT_2_BULLET_HEADING: {
    id: 'Terms.LineThree.Two.Bullet.Heading',
    defaultMessage: 'You represent, warrant, and agree that:',
  },
  LINE_3_DOT_2_BULLET_1: {
    id: 'Terms.LineThree.Two.Bullet.One',
    defaultMessage:
      'you will comply with all applicable laws, including privacy laws and intellectual property laws;',
  },
  LINE_3_DOT_2_BULLET_2: {
    id: 'Terms.LineThree.Two.Bullet.Two',
    defaultMessage:
      'you will not post inappropriate, inaccurate, untruthful, or objectionable content to the Service or Site;',
  },
  LINE_3_DOT_2_BULLET_3: {
    id: 'Terms.LineThree.Two.Bullet.Three',
    defaultMessage: 'you will not bully, harass, or advocate harassment of another user or person;',
  },
  LINE_3_DOT_2_BULLET_4: {
    id: 'Terms.LineThree.Two.Bullet.Four',
    defaultMessage: `you will not solicit passwords or Personal Data of any kind for commercial or 
    unlawful purposes from other users, or engage in commercial activities and/or sales such as 
    contests, sweepstakes, barter, advertising, and pyramid schemes;`,
  },
  LINE_3_DOT_2_BULLET_5: {
    id: 'Terms.LineThree.Two.Bullet.Five',
    defaultMessage: 'you will not post content that contains "junk mail" or "chain letters";',
  },
  LINE_3_DOT_2_BULLET_6: {
    id: 'Terms.LineThree.Two.Bullet.Six',
    defaultMessage: `you will not post content that is obscene or that promotes racism, 
    bigotry, hatred or physical harm of any kind against any group or individual;`,
  },
  LINE_3_DOT_2_BULLET_7: {
    id: 'Terms.LineThree.Two.Bullet.Seven',
    defaultMessage: `you will not post or upload any virus, time bomb, worm, corrupted file, 
    or other software routine capable of disrupting, disabling, or harming the operation of, 
    or providing unauthorized access, to the Service or Site;`,
  },
  LINE_3_DOT_2_BULLET_8: {
    id: 'Terms.LineThree.Two.Bullet.Eight',
    defaultMessage: `you will not use the Service or Site to do or promote anything that 
    is unlawful, illegal, misleading, defamatory, or libelous;`,
  },
  LINE_3_DOT_2_BULLET_9: {
    id: 'Terms.LineThree.Two.Bullet.Nine',
    defaultMessage: `you will not promote, or upload or post anything that contains, 
    an illegal and/or unauthorized copy of another person’s copyrighted work (whether marked as such or not).`,
  },
  LINE_3_DOT_2_BODY: {
    id: 'Terms.LineThree.Two.Body',
    defaultMessage: `If you violate the guidelines listed above, any other user guidelines posted on 
    the Service or Site, the terms of this Agreement, or if Foodsmart believes that any of your conduct or content 
    is offensive or illegal, violates the rights of, harms, or threatens the safety of third parties, 
    or may create liability for Foodsmart or third parties, Foodsmart reserves the right 
    (but is not obligated) to investigate and take appropriate legal action in its sole discretion, 
    including removing such content from the Service, notifying the appropriate authorities 
    regarding the source of such content, barring you from accessing the Service, and terminating your Account.`,
  },
  LINE_3_DOT_3_HEADING: {
    id: 'Terms.LineThree.Three.Heading',
    defaultMessage: '3.3 Public Content Advisory and Disclaimer',
  },
  LINE_3_DOT_3_BODY: {
    id: 'Terms.LineThree.Three.Body',
    defaultMessage: `You acknowledge that all Public Content publicly posted and all User Content privately transmitted 
    to you, is the sole responsibility of the person who originated such content. We may, but are not required to 
    monitor or control the content posted via the Service, and we do not take responsibility for such content. 
    Any use or reliance on any Public Content or User Content or materials posted via the Site or obtained by 
    you through the Service is at your own risk. We do not endorse, support, represent or guarantee the 
    completeness, truthfulness, accuracy, or reliability of any Content or communications posted via the Service 
    or endorse any opinions expressed via the Service. You understand that by using the Site and the Service, 
    you may be exposed to Content that might be offensive, harmful, inaccurate or otherwise inappropriate, 
    or in some cases, postings that have been mislabeled or are otherwise deceptive. Under no 
    circumstances will we be liable in any way for any Content, including, but not limited to, 
    any errors or omissions in any Content, or any loss or damage of any kind incurred as 
    a result of the use of any Content posted, emailed, transmitted or otherwise made 
    available via the Site or the Service.`,
  },
  LINE_3_DOT_4_HEADING: {
    id: 'Terms.LineThree.Four.Heading',
    defaultMessage: '3.4 Other Usage Restrictions',
  },
  LINE_3_DOT_4_BODY: {
    id: 'Terms.LineThree.Four.Body',
    defaultMessage: `You may not do any of the following while accessing or using the Site or the Service: 
    (i) access, tamper with, or use non-public areas of the Service, Foodsmart's computer systems, 
    or the technical delivery systems of Foodsmart's providers; (ii) probe, scan, or test the vulnerability of 
    any system or network or breach or circumvent any security or authentication measures; (iii) 
    access or search or attempt to access or search the Service by any means (automated or otherwise) other 
    than through our currently available, published interfaces that are provided by Foodsmart (and only pursuant 
      to those terms and conditions); (iv) forge any TCP/IP packet header or any part of the header information 
      in any email or posting, or in any way use the Service to send altered, deceptive or false source-identifying 
      information; or (v) interfere with, or disrupt, (or attempt to do so), the access of any user, 
      host or network, including, without limitation, sending a virus, overloading, flooding, spamming, 
      mail-bombing the Service, or by scripting the creation of content in a manner that interferes with 
      or creates an undue burden on the Service.`,
  },
  LINE_4_HEADING: {
    id: 'Terms.LineFour.Heading',
    defaultMessage: '4. Proprietary Rights',
  },
  LINE_4_DOT_1_HEADING: {
    id: 'Terms.LineFour.One.Heading',
    defaultMessage: '4.1 Use of the Service',
  },
  LINE_4_DOT_1_BODY: {
    id: 'Terms.LineFour.One.Body',
    defaultMessage: `Subject to the terms and conditions of this Agreement, Foodsmart grants you a limited, 
    non-exclusive, non-transferable, revocable license to access and use the Service and Site solely for your personal, 
    non-commercial purposes while this Agreement remains in effect. You will not: (a) permit any third party to 
    access or use the Service; (b) rent, lease, loan, sell, license, or transfer the Service or Site to any 
    third party or exploit the Service or Site for commercial purposes; (c) interfere with, disrupt, alter, translate, 
    or modify the Service or Site, or create an undue burden on the Service or Site or the networks or services connected to 
    the Service or Site; (d) reverse engineer, decompile, disassemble, or reverse compile the Service or Site; or 
    (e) introduce software or automated agents or scripts to the Service or Site so as to produce multiple accounts,
     generate automated searches, requests and queries, or to strip, scrape, or mine data from the Service or Site. 
     This license is for the sole purpose of enabling you to use and enjoy the benefit of the Service, solely in the 
     manner permitted by these Terms of Use.`,
  },
  LINE_4_DOT_2_HEADING: {
    id: 'Terms.LineFour.Two.Heading',
    defaultMessage: '4.2 Ownership',
  },
  LINE_4_DOT_2_BODY: {
    id: 'Terms.LineFour.Two.Body',
    defaultMessage: `Foodsmart and its licensors own the Service, the Site, all content (except for your Personal Data) 
    contained in the foregoing, and all intellectual property rights relating to the foregoing. Any unauthorized reproduction, 
    modification, distribution, transmission, display, scrape, or performance of any portion of the Service, the Site, 
    or any other content (except for your Personal Data) contained in the foregoing is strictly prohibited. 
    Foodsmart and its licensors reserve all rights not expressly granted under this Agreement. There are no implied licenses 
    in this Agreement.`,
  },
  LINE_4_DOT_3_HEADING: {
    id: 'Terms.LineFour.Three.Heading',
    defaultMessage: '4.3 Feedback',
  },
  LINE_4_DOT_3_BODY: {
    id: 'Terms.LineFour.Three.Body',
    defaultMessage: `Foodsmart will treat any suggestions, comments, or feedback relating to Foodsmart’s business, services, 
    and products ("Feedback") that you provide as non-confidential and nonproprietary. 
    You hereby grant Foodsmart the irrevocable, worldwide, fully transferable and sublicensable right 
    to use and exploit any Feedback that you provide in any manner and for any purpose without 
    any obligation to compensate you.`,
  },
  LINE_5_HEADING: {
    id: 'Terms.LineFive.Heading',
    defaultMessage: '5. Third Party Websites and Services',
  },
  LINE_5_BODY: {
    id: 'Terms.LineFive.Body',
    defaultMessage: `Our Service and Site contains links to Internet sites and services maintained by third parties. 
    These links are provided for your reference only. We do not control, operate, or endorse in any respect information, 
    products, or services on such third-party sites and are not responsible for their content. Additionally, 
    Our Service and Site may provide you with advertisements for third party products and/or services. 
    You acknowledge that Foodsmart does not create any third party advertisements and is not responsible 
    for any links to third party websites or services. Many third-party sites and services have their own 
    terms of use and privacy policies that differ from ours. This Agreement and the Foodsmart Privacy 
    Policy only apply to our Service and Site and do not apply to any other site or service.`,
  },
  LINE_6_HEADING: {
    id: 'Terms.LineSix.Heading',
    defaultMessage: '6. Foodsmart Agent Services',
  },
  LINE_6_BODY: {
    id: 'Terms.LineSix.Body',
    defaultMessage: `When using a Foodsmart agent to perform on your behalf with a third party supplier, you agree and 
    acknowledge that the third party supplier is providing the goods for you, and that Foodsmart is merely acting as 
    your agent. Where appropriate, Foodsmart will communicate with the third party supplier on your behalf. 
    Such third party suppliers may have their own terms of use and privacy policies which they require compliance with 
    in order to receive their goods, and you agree to comply with such policies, where applicable.
    While using a Foodsmart agent, we may require your payment method by credit/debit or charge card to complete 
    an order or purchase, and if you choose to provide such information, we will securely hold such details ("Payment Details"). 
    Foodsmart uses a trusted, Third Party PCI-compliant solution for storing and processing credit card payments. 
    Your credit card information is never stored on Foodsmart servers.
    If you request and authorize Foodsmart to use your Payment Details in order to pay a third party 
    supplier for products or services, you acknowledge and agree that Foodsmart shall have no liability 
    in respect of or be responsible in any way whatsoever in respect of the use of your Payment Details 
    provided that Foodsmart acts in accordance with the instructions issued by you in relation thereto.
    Foodsmart may at your order purchase goods or services on your behalf. In the event that Foodsmart acts 
    as a credit agent in this regard, you hereby authorize Foodsmart to deduct the credit sum from your 
    Payment Details within 30 days of the payment date. Unless otherwise agreed by a third party supplier, 
    you shall not be entitled to cancel any services requested where, on your instructions, performance has already begun.`,
  },
  LINE_7_HEADING: {
    id: 'Terms.LineSeven.Heading',
    defaultMessage: '7. Availability and Modification of Service',
  },
  LINE_7_BODY: {
    id: 'Terms.LineSeven.Body',
    defaultMessage: `Foodsmart reserves the right, from time to time, to suspend, modify, or discontinue 
    the Service or the Site, in whole or in part, with or without notice. You agree that Foodsmart will not be 
    liable to you or to any third party for any modification, discontinuance, or suspension of the Service or the Site, 
    in whole or in part.`,
  },
  LINE_8_HEADING: {
    id: 'Terms.LineEight.Heading',
    defaultMessage: '8. Termination',
  },
  LINE_8_BODY: {
    id: 'Terms.LineEight.Body',
    defaultMessage: `You may terminate your Account at any time and for any reason through the appropriate 
    account management page on the Service, if available, or by sending an e-mail to support@Foodsmart.com. 
    In Foodsmart’s sole discretion, Foodsmart has the right to terminate your Account, immediately effective upon 
    sending notice to you at the email address you provide in your Account. Upon termination of your Account by 
    either party, your right to access and use your Account and the Service will terminate immediately. 
    You agree that we will have no liability to you for any costs, expenses, losses, damages, 
    or liabilities arising out of or related to our termination of your Account, your access to and use of the Service, 
    or this Agreement. Even after this Agreement is terminated for any reason, the following provisions of 
    this Agreement will remain in effect: Sections 1, 4.2 and 7 through 18.`,
  },
  LINE_9_HEADING: {
    id: 'Terms.LineNine.Heading',
    defaultMessage: '9. Warranty Disclaimer',
  },
  LINE_9_BODY: {
    id: 'Terms.LineNine.Body',
    defaultMessage: `TO THE EXTENT PERMITTED UNDER APPLICABLE LAWS, FOODSMART PROVIDES THE SERVICE AND THE SITE 
    AND ANYSERVICES PROVIDED BY A THIRD PARTY SUPPLIER "AS-IS" AND "AS AVAILABLE" AND EXPRESSLY DISCLAIMS ALL WARRANTIES, 
    WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING THE WARRANTIES OF MERCHANTABILITY, FITNESS 
    FOR A PARTICULAR PURPOSE, TITLE, QUIET ENJOYMENT, ACCURACY, AND NON-INFRINGEMENT. FOODSMART MAKES NO WARRANTY 
    THAT THE SERVICE OR THE SITE WILL BE UNINTERRUPTED, FREE OF VIRUSES OR OTHER HARMFUL CODE, TIMELY, SECURE, 
    OR ERROR-FREE. FOODSMART DOES NOT ASSUME ANY OBLIGATION TO MONITOR ACTIVITIES CONDUCTED ON THE SERVICE OR THE SITE.
     FOODSMART DOES NOT GUARANTEE AND DOES NOT PROMISE ANY SPECIFIC RESULTS FROM THE USE OF THE SERVICE OR THE SITE.`,
  },
  LINE_10_HEADING: {
    id: 'Terms.LineTen.Heading',
    defaultMessage: '10. Limitation of Liability',
  },
  LINE_10_BODY: {
    id: 'Terms.LineTen.Body',
    defaultMessage: `TO THE EXTENT PERMITTED UNDER APPLICABLE LAWS, FOODSMART AND ITS AUTHORIZED AGENTS WILL 
    NOT BE LIABLE FOR ANY LOSS OF USE, LOST PROFITS, OR INDIRECT (INCLUDING WITHOUT LIMITATION COST OF 
      PROCURING SUBSTITUTE SERVICE OR LOST OPPORTUNITY, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, 
      SPECIAL OR PUNITIVE DAMAGES ARISING FROM OR RELATING TO YOUR USE OF THE SERVICE, THE SITE, OR THIS AGREEMENT, 
      WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOOD-WILL, OR OTHER INTANGIBLE LOSSES, 
      RESULTING FROM (i) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE; (ii) ANY CONDUCT 
      OR CONTENT OF ANY THIRD PARTY ON THE SERVICE, INCLUDING WITHOUT LIMITATION, ANY DEFAMATORY, OFFENSIVE 
      OR ILLEGAL CONDUCT OF OTHER USERS OR THIRD PARTIES; (iii) ANY CONTENT OBTAINED FROM THE SERVICE; 
      OR (iv) UNAUTHORIZED ACCESS, USE OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT, EVEN IF FOODSMART 
      HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
    TO THE EXTENT PERMITTED UNDER APPLICABLE LAWS, FOODSMART’S TOTAL CUMULATIVE LIABILITY IN CONNECTION 
    WITH THE SERVICE, THE SITE AND THIS AGREEMENT WILL AT ALL TIMES BE LIMITED TO FIFTY U.S. DOLLARS (U.S. $50). 
    THE EXISTENCE OF MORE THAN ONE CLAIM WILL NOT ENLARGE THIS LIMIT. IN NO EVENT WILL FOODSMART’S SUPPLIERS HAVE 
    ANY LIABILITY UNDER OR RESULTING FROM THIS AGREEMENT.`,
  },
  LINE_11_HEADING: {
    id: 'Terms.LineEleven.Heading',
    defaultMessage: '11. User Indemnification',
  },
  LINE_11_BODY: {
    id: 'Terms.LineEleven.Body',
    defaultMessage: `You agree to indemnify and hold Foodsmart, its subsidiaries, affiliates, directors, officers, agents,
     and employees harmless from any loss, liability, claim, demand, costs, or expenses, including 
     reasonable attorney’s fees, arising out of or relating to your: (a) User Content or Public Content; 
     (b) use of the Service or Site, including OrderWell; (c) breach of this Agreement; 
     (d) breach or inaccuracy of any representation or warranty made under this Agreement; 
     or (e) violation of applicable laws or any of the rights of third parties.`,
  },
  LINE_12_HEADING: {
    id: 'Terms.LineTwelve.Heading',
    defaultMessage: '12. User Disputes and Release',
  },
  LINE_12_BODY: {
    id: 'Terms.LineTwelve.Body',
    defaultMessage: `You are solely responsible for your interactions with other users. Foodsmart reserves the right, 
    but has no obligation, to monitor, or take any action Foodsmart deems appropriate regarding, 
    disputes between you and other users. To the extent permitted under applicable laws, 
    you hereby release Foodsmart from any and all claims or liability related to: 
    (a) any content posted on the Service or Site by you or other users; or (b) the conduct, whether online or offline, 
    of any other user.
    You hereby waive California Civil Code Section 1542 (and any similar provision in any other jurisdiction) 
    which states: "A GENERAL RELEASE DOES NOT EXTEND TO CLAIMS WHICH THE CREDITOR DOES 
    NOT KNOW OR SUSPECT TO EXIST IN HIS FAVOR AT THE TIME OF EXECUTING THE RELEASE, WHICH, 
    IF KNOWN BY HIM MUST HAVE MATERIALLY AFFECTED HIS SETTLEMENT WITH THE DEBTOR."`,
  },
  LINE_13_HEADING: {
    id: 'Terms.LineThirteen.Heading',
    defaultMessage: '13. Copyright Policy',
  },
  LINE_13_BODY: {
    id: 'Terms.LineThirteen.Body',
    defaultMessage: `You may not post, distribute, or reproduce in any way any Foodsmart copyrighted material, 
    trademarks, or other proprietary information unless you have the right to do so. 
    It is Foodsmart’s policy to, in its sole discretion, terminate the Account of any user who repeatedly 
    infringes copyright rights of Foodsmart or third parties. If you believe that your work has been 
    copied and posted on the Service or Site in a way that constitutes copyright infringement, 
    please follow the requirements for appropriate notifications under the Digital Millennium 
    Copyright Act (DMCA), 17 U.S.C. 512. At a minimum, you must provide our Copyright Agent 
    with the following information: (i) an electronic or physical signature of the person 
    authorized to act on behalf of the owner of the copyright interest; (ii) a description 
    of the copyrighted work that you claim has been infringed; (iii) an identification of 
    the location on the Site or Service of the material that you claim is infringing; 
    (iv) your address, telephone number, and email address; (v) a written statement by you that 
    you have a good faith belief that the disputed use is not authorized by the copyright owner, 
    its agent, or the law; and (vi) a statement by you, made under penalty of perjury, that the 
    above information in your notice is accurate and that you are the copyright owner or authorized to 
    act on the copyright owner’s behalf. We provide a template email for your convenience at www.Foodsmart.com/dmca.
    We reserve the right to remove content alleged to be infringing without prior notice and at 
    our sole discretion. In appropriate circumstances, Foodsmart also will terminate a user's account 
    if the user is determined to be a repeat infringer.
    Foodsmart’s Copyright Agent for notice of claims of copyright infringement can be reached by writing the following:
    Zipongo, Inc., dba Foodsmart, Attn: Copyright Agent, 595 California Street, FL 4, San Francisco, CA 94133.`,
  },
  LINE_14_HEADING: {
    id: 'Terms.LineFourteen.Heading',
    defaultMessage: '14. Disclosures',
  },
  LINE_14_BODY: {
    id: 'Terms.LineFourteen.Body',
    defaultMessage: `Foodsmart is located at 595 California Street, Fl 4, San Francisco, CA 94133. 
    If you are a California resident, you may report complaints to the Complaint Assistance Unit 
    of the Division of Consumer Services of the California Department of Consumer Affairs 
    by contacting them in writing at 400 R Street, Sacramento, CA 95814, or by telephone at (800) 952-5210.`,
  },
  LINE_15_HEADING: {
    id: 'Terms.LineFifteen.Heading',
    defaultMessage: '15. Zipongo Communications',
  },
  LINE_15_BODY: {
    id: 'Terms.LineFifteen.Body',
    defaultMessage: `The communications between you and Zipongo use electronic and telephonic means, 
    whether you use the Service or Site,  send us emails, or call Foodsmart’s customer support team, 
    or whether Zipongo posts notices on the Service or Site or communicates with you via email, 
    SMS, push notifications on your device, phone call, or mail. For contractual purposes, 
    you (a) consent to receive communications from Zipongo in these forms; 
    and (b) agree that all terms and conditions, agreements, notices, disclosures, 
    and other communications that Zipongo provides to you satisfy any 
    legal requirement that such communications would satisfy if it were in a hardcopy writing. 
    The foregoing does not affect your non-waivable rights.`,
  },
  LINE_16_HEADING: {
    id: 'Terms.LineSixteen.Heading',
    defaultMessage: '16. Governing Law; Arbitration',
  },
  LINE_16_BODY: {
    id: 'Terms.LineSixteen.Body',
    defaultMessage: `This Agreement, and any claim, dispute or controversy relating to this Agreement, 
    will be governed by the laws of California, without giving effect to any conflicts of laws principles 
    that require the application of the laws of a different jurisdiction. 
    Any action or proceeding relating to this Agreement must be brought in a federal or state court located in San Francisco, 
    California and each party irrevocably submits to the jurisdiction and venue of any such court in any such action 
    or proceeding and you waive any jurisdictional, venue, or inconvenient forum objections, 
    except that: (i) a party bringing an action may choose to resolve the dispute 
    through binding non-appearance-based arbitration in accordance with the following: 
    (a) the arbitration will be provided through JAMS; (b) the arbitration will be conducted in one 
    or more of the following manners at the option of the party initiating arbitration: telephone, online, 
    or written submissions; (c) the arbitration will not involve any personal appearances by the parties 
    or witnesses unless otherwise agreed by the parties; and (d) any judgment on the award rendered by the arbitrator
     may be entered in any court of competent jurisdiction; and (ii) Foodsmart may seek injunctive relief in any court
      having jurisdiction to protect its rights and interests, including but not limited to, 
      with regard to its intellectual property or confidential or proprietary information.`,
  },
  LINE_17_HEADING: {
    id: 'Terms.LineSeventeen.Heading',
    defaultMessage: '17. General',
  },
  LINE_17_BODY: {
    id: 'Terms.LineSeventeen.Body',
    defaultMessage: `The parties are independent contractors. The End User shall not use the site for 
    any commercial purpose under any circumstance, unless in each instance the End User has obtained 
    explicit written approval by Foodsmart. If any provision of this Agreement is unenforceable, 
    such provision will be changed and interpreted to accomplish the objectives of such provision 
    to the greatest extent possible under applicable law and the remaining provisions will continue 
    in full force and effect. All waivers by Foodsmart will be effective only if in writing. 
    Any waiver or failure by Foodsmart to enforce any provision of this Agreement on one occasion will 
    not be deemed a waiver of any other provision or of such provision on any other occasion. 
    You acknowledge that the Service and Site contains valuable trade secrets and proprietary information of Foodsmart, 
    that any actual or threatened breach of Section 4.2 (Ownership) of this Agreement will constitute immediate, 
    irreparable harm to Foodsmart for which monetary damages would be an inadequate remedy, 
    and that injunctive relief is an appropriate remedy for such breach. 
    The headings of Sections of this Agreement are for convenience and are not to be used 
    in interpreting this Agreement. "Includes" and "including" are not limiting. 
    This Agreement and the Privacy Policy constitute the final, complete, 
    and exclusive agreement between the parties regarding the subject hereof and supersede 
    all prior or contemporaneous agreements, understandings, and communication, whether written or oral.`,
  },
  LINE_18_HEADING: {
    id: 'Terms.LineEighteen.Heading',
    defaultMessage: '18. Changes',
  },
  LINE_18_BODY: {
    id: 'Terms.LineEighteen.Body',
    defaultMessage: `We may amend this Agreement, including the Privacy Policy, from time to time. If we make material changes to the Agreement, 
    we will notify you by posting the change on the Service or Site or sending you an e-mail at your primary email address, 
    as specified in your Account. Any changes to this Agreement will be effective immediately for new users of our Service or Site; 
    otherwise these changes will be effective upon the earlier of thirty (30) calendar days following our dispatch of an e-mail notice to you or 
    thirty (30) calendar days following our posting of a notice on our Service or Site. 
    You are responsible at all times for updating your Account to provide to us your most current e-mail address. 
    If the last e-mail address that you have provided to us is not valid, or for any reason is not capable of delivering to you the notice described above, 
    our dispatch of the e-mail containing such notice will nonetheless constitute effective notice of the changes described in the notice. 
    Continued use of our Service or Site following notice of such changes shall indicate your acknowledgement of, and agreement to be bound by, such changes. 
    Except as otherwise provided in this section, no amendment to this Agreement will be valid unless in a writing hand-signed by the parties.`,
  },
  LINE_19_HEADING: {
    id: 'Terms.LineNineteen.Heading',
    defaultMessage: '19. Trademark and Copyright Notice',
  },
  LINE_19_BODY: {
    id: 'Terms.LineNineteen.Body',
    defaultMessage: `"Zipongo", "Zipongo, Eating Well Made Simple", “Foodsmart”, "OrderWell" and other names, 
    slogans, graphics, logos, and trade names used on the Service and Site are the trademarks of Foodsmart and may not be used without Foodsmart’s permission. 
    Third-party trademarks, registered trademarks, service marks, trade names, product names, and company names or logos that may appear 
    on the Service or Site are the property of their respective owners, including Apple, Inc. Apple, 
    the Apple logo and iPhone are trademarks of Apple Inc., registered in the U.S. and other countries. 
    App Store is a service mark of Apple Inc. Android and the Android logo are registered trademarks of Google, Inc.`,
  },
  LINE_20_HEADING: {
    id: 'Terms.LineTwenty.Heading',
    defaultMessage: '20. Sweepstake Tax',
  },
  LINE_20_BODY: {
    id: 'Terms.LineTwenty.Body',
    defaultMessage: `For any Sweepstake that you may enter while using the Foodsmart Services, YOU HEREBY EXPRESSLY ACKNOWLEDGE 
    AND AGREE THAT THE DOLLARS, INCENTIVES OR REWARDS RECEIVED THROUGH THE SERVICES MAY BE SUBJECT TO TAX, 
    WHICH IS THE SOLE RESPONSIBILITY OF YOU, THE END USER RECIPIENT. Foodsmart may provide you and/or the appropriate government agency 
    or taxing authority with information related to any payments or incentives you earn in connection with your use of the Services. 
    You agree to provide Foodsmart with all required information to assist Foodsmart in complying with its reporting or withholding obligations. 
    Foodsmart may withhold any tax from any incentive or reward as required by applicable law. 
    All such sweepstakes are subject to the applicable Sweepstake Official Rules.`,
  },
  REVISION_DATE: {
    id: 'Terms.RevisionDate',
    defaultMessage:
      'Revised October 2017, 2018, 2021, 2022. Copyright © 2022, Zipongo, Inc., dba Foodsmart',
  },
};

export default function AppTerms() {
  return (
    <LegalWrapper currentTab="app-terms">
      <div>
        <h1>
          <FormattedMessage {...I18N_MESSAGES.HEADING_NORMAL} />
        </h1>
        <h3>
          <FormattedMessage {...I18N_MESSAGES.HEADING_SMALL} />
        </h3>
        <p>
          <FormattedMessage {...I18N_MESSAGES.MAIN_PARAGRAPH} />
        </p>
        <h4>
          <FormattedMessage {...I18N_MESSAGES.LINE_I_HEADING} />
        </h4>
        <p>
          <FormattedMessage {...I18N_MESSAGES.LINE_I_BODY} />
        </p>
        <ol>
          <li>
            <h4>
              <FormattedMessage {...I18N_MESSAGES.LINE_1_HEADING} />
            </h4>
            <p>
              <FormattedMessage {...I18N_MESSAGES.LINE_1_BODY} />
            </p>
          </li>
          <li>
            <h4>
              <FormattedMessage {...I18N_MESSAGES.LINE_2_HEADING} />
            </h4>
            <p>
              <FormattedMessage {...I18N_MESSAGES.LINE_2_BODY} />
            </p>
          </li>
          <li>
            <h4>
              <FormattedMessage {...I18N_MESSAGES.LINE_3_HEADING} />
            </h4>
            <ol>
              <li>
                <h5>
                  <FormattedMessage {...I18N_MESSAGES.LINE_3_DOT_1_HEADING} />
                </h5>
                <p>
                  <FormattedMessage {...I18N_MESSAGES.LINE_3_DOT_1_BODY} />
                </p>
              </li>
              <li>
                <h5>
                  <FormattedMessage {...I18N_MESSAGES.LINE_3_DOT_2_HEADING} />
                </h5>
                <p>
                  <FormattedMessage {...I18N_MESSAGES.LINE_3_DOT_2_BULLET_HEADING} />
                </p>
                <ul>
                  <li>
                    <FormattedMessage {...I18N_MESSAGES.LINE_3_DOT_2_BULLET_1} />
                  </li>
                  <li>
                    <FormattedMessage {...I18N_MESSAGES.LINE_3_DOT_2_BULLET_2} />
                  </li>
                  <li>
                    <FormattedMessage {...I18N_MESSAGES.LINE_3_DOT_2_BULLET_3} />
                  </li>
                  <li>
                    <FormattedMessage {...I18N_MESSAGES.LINE_3_DOT_2_BULLET_4} />
                  </li>
                  <li>
                    <FormattedMessage {...I18N_MESSAGES.LINE_3_DOT_2_BULLET_5} />
                  </li>
                  <li>
                    <FormattedMessage {...I18N_MESSAGES.LINE_3_DOT_2_BULLET_6} />
                  </li>
                  <li>
                    <FormattedMessage {...I18N_MESSAGES.LINE_3_DOT_2_BULLET_7} />
                  </li>
                  <li>
                    <FormattedMessage {...I18N_MESSAGES.LINE_3_DOT_2_BULLET_8} />
                  </li>
                  <li>
                    <FormattedMessage {...I18N_MESSAGES.LINE_3_DOT_2_BULLET_9} />
                  </li>
                </ul>
                <p>
                  <FormattedMessage {...I18N_MESSAGES.LINE_3_DOT_2_BODY} />
                </p>
              </li>
              <li>
                <h5>
                  <FormattedMessage {...I18N_MESSAGES.LINE_3_DOT_3_HEADING} />
                </h5>
                <p>
                  <FormattedMessage {...I18N_MESSAGES.LINE_3_DOT_3_BODY} />
                </p>
              </li>
              <li>
                <h5>
                  <FormattedMessage {...I18N_MESSAGES.LINE_3_DOT_4_HEADING} />
                </h5>
                <p>
                  <FormattedMessage {...I18N_MESSAGES.LINE_3_DOT_4_BODY} />
                </p>
              </li>
            </ol>
          </li>
          <li>
            <h4>
              <FormattedMessage {...I18N_MESSAGES.LINE_4_HEADING} />
            </h4>
            <ol>
              <li>
                <h5>
                  <FormattedMessage {...I18N_MESSAGES.LINE_4_DOT_1_HEADING} />
                </h5>
                <p>
                  <FormattedMessage {...I18N_MESSAGES.LINE_4_DOT_1_BODY} />
                </p>
              </li>
              <li>
                <h5>
                  <FormattedMessage {...I18N_MESSAGES.LINE_4_DOT_2_HEADING} />
                </h5>
                <p>
                  <FormattedMessage {...I18N_MESSAGES.LINE_4_DOT_2_BODY} />
                </p>
              </li>
              <li>
                <h5>
                  <FormattedMessage {...I18N_MESSAGES.LINE_4_DOT_3_HEADING} />
                </h5>
                <p>
                  <FormattedMessage {...I18N_MESSAGES.LINE_4_DOT_3_BODY} />
                </p>
              </li>
            </ol>
          </li>
          <li>
            <h4>
              <FormattedMessage {...I18N_MESSAGES.LINE_5_HEADING} />
            </h4>
            <p>
              <FormattedMessage {...I18N_MESSAGES.LINE_5_BODY} />
            </p>
          </li>
          <li>
            <h4>
              <FormattedMessage {...I18N_MESSAGES.LINE_6_HEADING} />
            </h4>
            <p>
              <FormattedMessage {...I18N_MESSAGES.LINE_6_BODY} />
            </p>
          </li>
          <li>
            <h4>
              <FormattedMessage {...I18N_MESSAGES.LINE_7_HEADING} />
            </h4>
            <p>
              <FormattedMessage {...I18N_MESSAGES.LINE_7_BODY} />
            </p>
          </li>
          <li>
            <h4>
              <FormattedMessage {...I18N_MESSAGES.LINE_8_HEADING} />
            </h4>
            <p>
              <FormattedMessage {...I18N_MESSAGES.LINE_8_BODY} />
            </p>
          </li>
          <li>
            <h4>
              <FormattedMessage {...I18N_MESSAGES.LINE_9_HEADING} />
            </h4>
            <p>
              <FormattedMessage {...I18N_MESSAGES.LINE_9_BODY} />
            </p>
          </li>
          <li>
            <h4>
              <FormattedMessage {...I18N_MESSAGES.LINE_10_HEADING} />
            </h4>
            <p>
              <FormattedMessage {...I18N_MESSAGES.LINE_10_BODY} />
            </p>
          </li>
          <li>
            <h4>
              <FormattedMessage {...I18N_MESSAGES.LINE_11_HEADING} />
            </h4>
            <p>
              <FormattedMessage {...I18N_MESSAGES.LINE_11_BODY} />
            </p>
          </li>
          <li>
            <h4>
              <FormattedMessage {...I18N_MESSAGES.LINE_12_HEADING} />
            </h4>
            <p>
              <FormattedMessage {...I18N_MESSAGES.LINE_12_BODY} />
            </p>
          </li>
          <li>
            <h4>
              <FormattedMessage {...I18N_MESSAGES.LINE_13_HEADING} />
            </h4>
            <p>
              <FormattedMessage {...I18N_MESSAGES.LINE_13_BODY} />
            </p>
          </li>
          <li>
            <h4>
              <FormattedMessage {...I18N_MESSAGES.LINE_14_HEADING} />
            </h4>
            <p>
              <FormattedMessage {...I18N_MESSAGES.LINE_14_BODY} />
            </p>
          </li>
          <li>
            <h4>
              <FormattedMessage {...I18N_MESSAGES.LINE_15_HEADING} />
            </h4>
            <p>
              <FormattedMessage {...I18N_MESSAGES.LINE_15_BODY} />
            </p>
          </li>
          <li>
            <h4>
              <FormattedMessage {...I18N_MESSAGES.LINE_16_HEADING} />
            </h4>
            <p>
              <FormattedMessage {...I18N_MESSAGES.LINE_16_BODY} />
            </p>
          </li>
          <li>
            <h4>
              <FormattedMessage {...I18N_MESSAGES.LINE_17_HEADING} />
            </h4>
            <p>
              <FormattedMessage {...I18N_MESSAGES.LINE_17_BODY} />
            </p>
          </li>
          <li>
            <h4>
              <FormattedMessage {...I18N_MESSAGES.LINE_18_HEADING} />
            </h4>
            <p>
              <FormattedMessage {...I18N_MESSAGES.LINE_18_BODY} />
            </p>
          </li>
          <li>
            <h4>
              <FormattedMessage {...I18N_MESSAGES.LINE_19_HEADING} />
            </h4>
            <p>
              <FormattedMessage {...I18N_MESSAGES.LINE_19_BODY} />
            </p>
          </li>
          <li>
            <h4>
              <FormattedMessage {...I18N_MESSAGES.LINE_20_HEADING} />
            </h4>
            <p>
              <FormattedMessage {...I18N_MESSAGES.LINE_20_BODY} />
            </p>
          </li>
        </ol>
        <p>
          <FormattedMessage {...I18N_MESSAGES.REVISION_DATE} />
        </p>
      </div>
    </LegalWrapper>
  );
}
