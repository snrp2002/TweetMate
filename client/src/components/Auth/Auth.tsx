import classes from './Auth.module.css';
import AuthForm from './AuthForm';

export default function Auth() {
  return (
    <div className={classes.spread}>
      <section className={classes.pitch}>
        <h1 className={classes.headline}>
          Photographs, and <i>small thoughts</i> about them.
        </h1>
        <p className={classes.lede}>
          Share what you saw today. Keep the ones you love. Follow the light.
        </p>

        <ul className={classes.points}>
          <li>Post photos with captions and tags</li>
          <li>Like and comment on anything in the feed</li>
          <li>Keep a profile with everything you&rsquo;ve shared</li>
        </ul>
      </section>

      <section className={classes.panel}>
        <AuthForm />
      </section>
    </div>
  );
}
