/* eslint-disable object-curly-newline */
import createSessionContext from '@arcblock/did-react/lib/Session';

const { SessionProvider, SessionContext, SessionConsumer, withSession } = createSessionContext('hashnews_login_token');
export { SessionProvider, SessionContext, SessionConsumer, withSession };
