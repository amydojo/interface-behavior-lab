# Component Specifications

Each component family is documented as a behavioral contract rather than a visual skin.

| Component | States | Signal property |
| --- | --- | --- |
| [Intent Button](intent-button.md) | Rest, Revealed, Confirmed | Show signal |
| [Pressure Button](pressure-button.md) | Preview, Act, Commit, Recover | Show pressure meter |
| [Breathing Button](breathing-button.md) | Ready, Listening, Processing, Complete | Show breath signal |
| [Magnetic Button](magnetic-button.md) | Far, Near, Aligned, Released | Show field |
| [Ethical Button](ethical-button.md) | Notice, Resist, Hold, Confirmed | Show consequence meter |
| [Reversible Button](reversible-button.md) | Result, Window, Expiring, Expired | Show recovery timer |

All families include M and L sizes, editable label and metadata properties, a minimum 44 px target, and Light, Dark, and Spatial semantic compatibility.
