/*global*/
import './home.scss';
import { provide } from '@lit/context';
import { html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import type { State } from '../../home/protocol';
import { DidChangeSubscription, DidFocusAccount } from '../../home/protocol';
import {
	ActiveOverviewState,
	activeOverviewStateContext,
	InactiveOverviewState,
	inactiveOverviewStateContext,
} from '../plus/home/components/overviewState';
import type { GlHomeHeader } from '../plus/shared/components/home-header';
import { GlAppHost } from '../shared/appHost';
import { scrollableBase } from '../shared/components/styles/lit/base.css';
import type { HostIpc } from '../shared/ipc';
import { homeBaseStyles, homeStyles } from './home.css';
import { HomeStateProvider } from './stateProvider';
import '../plus/shared/components/home-header';
import '../plus/home/components/active-work';
import '../plus/home/components/launchpad';
import '../plus/home/components/overview';
import './components/feature-nav';
import './components/ama-banner';
import './components/integration-banner';
import './components/preview-banner';
import './components/promo-banner';
import './components/repo-alerts';

@customElement('gl-home-app')
export class GlHomeApp extends GlAppHost<State> {
	static override styles = [homeBaseStyles, scrollableBase, homeStyles];

	@provide({ context: activeOverviewStateContext })
	private _activeOverviewState!: ActiveOverviewState;

	@provide({ context: inactiveOverviewStateContext })
	private _inactiveOverviewState!: InactiveOverviewState;

	@query('gl-home-header')
	private _header!: GlHomeHeader;

	private badgeSource = { source: 'home', detail: 'badge' };

	protected override createStateProvider(state: State, ipc: HostIpc): HomeStateProvider {
		this.disposables.push((this._activeOverviewState = new ActiveOverviewState(ipc)));
		this.disposables.push((this._inactiveOverviewState = new InactiveOverviewState(ipc)));

		return new HomeStateProvider(this, state, ipc);
	}

	override connectedCallback(): void {
		super.connectedCallback?.();

		this.disposables.push(
			this._ipc.onReceiveMessage(msg => {
				switch (true) {
					case DidFocusAccount.is(msg):
						this._header.show();
						break;
					case DidChangeSubscription.is(msg):
						this._header.refreshPromo();
						break;
				}
			}),
		);
	}

	override render(): unknown {
		return html`
			<div class="home scrollable">
				<gl-home-header class="home__header"></gl-home-header>
				${when(!this.state?.previewEnabled, () => html`<gl-preview-banner></gl-preview-banner>`)}
				${when(this.state?.amaBannerCollapsed === false, () => html`<gl-ama-banner></gl-ama-banner>`)}
				<gl-repo-alerts class="home__alerts"></gl-repo-alerts>
				<main class="home__main scrollable" id="main">
					${when(
						this.state?.previewEnabled === true,
						() => html`
							<gl-preview-banner></gl-preview-banner>
							<gl-active-work></gl-active-work>
							<gl-launchpad></gl-launchpad>
							<gl-overview></gl-overview>
						`,
						() => html`<gl-feature-nav .badgeSource=${this.badgeSource}></gl-feature-nav>`,
					)}
				</main>
			</div>
		`;
	}
}
