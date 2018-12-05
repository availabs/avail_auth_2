const HTML_TEMPLATE = `
<!DOCTYPE html>
<html>
	<body style="background-color: #222533; padding: 20px; font-family: font-size: 14px; line-height: 1.43; font-family: &quot;Helvetica Neue&quot;, &quot;Segoe UI&quot;, Helvetica, Arial, sans-serif;">
		<div style="max-width: 600px; margin: 0px auto; background-color: #fff; box-shadow: 0px 20px 50px rgba(0,0,0,0.05);">
			<div style="padding: 60px 70px; border-top: 1px solid rgba(0,0,0,0.05);">
				<div style="border: 2px solid #4B72FA; padding: 40px; margin: 40px 0px;">
					<h4 style="margin: 0px; font-size: 24px; display: inline-block; border-bottom: 1px solid #111;">
						__BODY_1__
					</h4>
					<h4 style="font-size: 18px; margin: 15px 0px;">
						__BODY_2__
					</h4>
					<table style="width: 100%; border-top: 1px solid #eee">
						<tr>
							<td style="text-align: right; padding-left: 20px;">
								<a href="__HREF__" style="padding: 8px 20px; background-color: #4B72FA; color: #fff; font-weight: bolder; font-size: 16px; display: inline-block; margin-top: 10px; text-decoration: none;">__CLICK__</a>
							</td>
						</tr>
					</table>
				</div>
			</div>
		</div>
	</body>
</html>
`;

const HTML_TEMPLATE_NO_CLICK = `
<!DOCTYPE html>
<html>
	<body style="background-color: #222533; padding: 20px; font-family: font-size: 14px; line-height: 1.43; font-family: &quot;Helvetica Neue&quot;, &quot;Segoe UI&quot;, Helvetica, Arial, sans-serif;">
		<div style="max-width: 600px; margin: 0px auto; background-color: #fff; box-shadow: 0px 20px 50px rgba(0,0,0,0.05);">
			<div style="padding: 60px 70px; border-top: 1px solid rgba(0,0,0,0.05);">
				<div style="border: 2px solid #4B72FA; padding: 40px; margin: 40px 0px;">
					<h4 style="margin: 0px; font-size: 24px; display: inline-block; border-bottom: 1px solid #111;">
						__BODY_1__
					</h4>
					<h4 style="font-size: 18px; margin: 15px 0px;">
						__BODY_2__
					</h4>
				</div>
			</div>
		</div>
	</body>
</html>
`;

module.exports = {
	htmlTemplate: (body1, body2, href, click) =>
		HTML_TEMPLATE.replace("__BODY_1__", body1)
			.replace("__BODY_2__", body2)
			.replace("__HREF__", href)
			.replace("__CLICK__", click),
	htmlTemplateNoClick: (body1, body2) =>
		HTML_TEMPLATE_NO_CLICK.replace("__BODY_1__", body1)
			.replace("__BODY_2__", body2),
}			