import {Context, Scenes} from "telegraf";
import {Guest} from "./Guest";

interface TicketSession extends Scenes.WizardSession {
    guestProp: Guest
}

export interface TicketContext extends Context {
    session: TicketSession
    scene: Scenes.SceneContextScene<TicketContext, Scenes.WizardSessionData>
    wizard: Scenes.WizardContextWizard<TicketContext>
}
