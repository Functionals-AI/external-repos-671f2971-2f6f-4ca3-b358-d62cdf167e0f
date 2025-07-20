import React from 'react';
import HyperlinkedText from '.';

describe('HyperlinkedText Component', () => {
  it('handles empty or undefined', () => {
    cy.mount(<HyperlinkedText text="" />);
    cy.get('a').should('not.exist');
    cy.mount(<HyperlinkedText />);
    cy.get('a').should('not.exist');
  });

  it('renders plain text correctly', () => {
    const text = "This is a note that should be visible.";

    cy.mount(<HyperlinkedText text={text} />);

    cy.contains(text)
    cy.should('not.have.attr', 'href')
  });

  it('can render a single link', () => {
    const text = "Here is a link: https://colorhunt.co/palette/e0ece4ff4b5c05667466bfbf";
    const url = "https://colorhunt.co/palette/e0ece4ff4b5c05667466bfbf";

    cy.mount(<HyperlinkedText text={text} />);

    cy.contains(url)
    cy.should('have.attr', 'href', url)
    cy.should('have.attr', 'target', '_blank')
    cy.should('have.attr', 'rel', 'noopener noreferrer');
  });

  it('renders text with multiple URLs correctly', () => {
    const text = "Here are two links: https://example.com and https://another-example.com";
    const url1 = "https://example.com";
    const url2 = "https://another-example.com";

    cy.mount(<HyperlinkedText text={text} />);

    cy.contains(url1)
    cy.should('have.attr', 'href', url1)

    cy.contains(url2)
    cy.should('have.attr', 'href', url2)
  });

  it('ignores non-http/https links', () => {
    const text = "Visit https://valid.com but not ftp://invalid.com or mailto:email@example.com.";

    cy.mount(<HyperlinkedText text={text} />);

    cy.contains('https://valid.com').should('have.attr', 'href', 'https://valid.com');
    cy.contains('ftp://invalid.com').should('not.have.attr', 'href');
    cy.contains('mailto:email@example.com').should('not.have.attr', 'href');
  });

  it('still works with url encoding', () => {
    const text = "Check this link: https://example.com/search?q=cypress%20testing";
    const url = "https://example.com/search?q=cypress%20testing";
    
    cy.mount(<HyperlinkedText text={text} />);
    
    cy.contains(url).should('have.attr', 'href', url);
  });  
});
