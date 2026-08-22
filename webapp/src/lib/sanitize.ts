import sanitizeHtml from 'sanitize-html';

// The rich text editor posts HTML, and question/answer content is rendered with
// dangerouslySetInnerHTML - so the markup has to be scrubbed before it is
// stored. Client-side sanitizing is not enough: the API can be called directly.
const options: sanitizeHtml.IOptions = {
    allowedTags: [
        'p', 'br', 'strong', 'em', 's', 'code', 'pre', 'blockquote',
        'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'img',
    ],
    allowedAttributes: {
        a: ['href', 'title', 'target', 'rel'],
        img: ['src', 'alt', 'title', 'width', 'height'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    // Images may only point at our own Cloudinary account. Otherwise a question
    // body becomes a way to hotlink arbitrary hosts, and every reader's IP
    // leaks to whoever the author chose.
    allowedSchemesByTag: {
        img: ['https'],
    },
    allowedIframeHostnames: [],
    exclusiveFilter: frame =>
        frame.tag === 'img' && !/^https:\/\/res\.cloudinary\.com\//.test(frame.attribs.src ?? ''),
    transformTags: {
        // Anything user-supplied that opens a new tab needs noopener, or the
        // linked page gets a handle on our window via window.opener.
        a: sanitizeHtml.simpleTransform('a', {rel: 'noopener noreferrer', target: '_blank'}),
    },
};

export function sanitizeContent(html: string) {
    return sanitizeHtml(html, options);
}
