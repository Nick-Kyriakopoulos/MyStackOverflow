import sanitizeHtml from 'sanitize-html';

// The rich text editor posts HTML, and question/answer content is rendered with
// dangerouslySetInnerHTML - so the markup has to be scrubbed before it is
// stored. Client-side sanitizing is not enough: the API can be called directly.
const options: sanitizeHtml.IOptions = {
    allowedTags: [
        'p', 'br', 'strong', 'em', 's', 'code', 'pre', 'blockquote',
        'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a',
    ],
    allowedAttributes: {
        a: ['href', 'title', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
        // Anything user-supplied that opens a new tab needs noopener, or the
        // linked page gets a handle on our window via window.opener.
        a: sanitizeHtml.simpleTransform('a', {rel: 'noopener noreferrer', target: '_blank'}),
    },
};

export function sanitizeContent(html: string) {
    return sanitizeHtml(html, options);
}
